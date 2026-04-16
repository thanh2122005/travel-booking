// API SUMMARY: src/app/api/bookings/route.ts
// Phạm vi: API public hoặc user đã đăng nhập.
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma, TourStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { demoCreatePublicBooking } from "@/lib/demo/admin-demo-store";
import { saveContactInquiry } from "@/lib/demo/contact-inquiry-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { bookingSchema } from "@/lib/validations/booking";

const CHILD_5_TO_7_PRICE_RATIO = 0.5;
const CHILD_UNDER_5_PRICE_RATIO = 0;

function isGuestBreakdownPersistenceError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
    return true;
  }
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Unknown argument `guestsFrom8`") ||
    message.includes("Unknown argument `child5To7Guests`") ||
    message.includes("Unknown argument `childUnder5Guests`") ||
    message.includes("The column") && message.includes("does not exist")
  );
}

function buildBookingCode() {
  // Mã booking theo ngày để dễ truy vết khi hỗ trợ khách hàng.
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TB${yyyy}${mm}${dd}${random}`;
}

function buildInquiryReferenceCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TV${yy}${mm}${dd}${random}`;
}

async function getUniqueBookingCodeTx(tx: Prisma.TransactionClient) {
  // Retry vài lần để tránh đụng unique key khi nhiều request đồng thời.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const bookingCode = buildBookingCode();
    const existed = await tx.booking.findUnique({
      where: { bookingCode },
      select: { id: true },
    });

    if (!existed) {
      return bookingCode;
    }
  }

  return `TB${Date.now()}`;
}

async function createCapacityShortageInquiry(input: {
  fullName: string;
  email: string;
  phone: string;
  tourId: string;
  departureDate: Date;
  numberOfGuests: number;
  remainingSeats: number;
}) {
  const message = [
    "Khách đặt tour nhưng không đủ chỗ trống theo ngày đã chọn.",
    `Số khách yêu cầu: ${input.numberOfGuests}.`,
    `Số chỗ còn lại: ${input.remainingSeats}.`,
    "Vui lòng admin liên hệ để tư vấn đổi ngày/điều chỉnh số khách.",
  ].join(" ");

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const inquiry = await db.contactInquiry.create({
          data: {
            referenceCode: buildInquiryReferenceCode(),
            fullName: input.fullName,
            phone: input.phone,
            email: input.email,
            tourId: input.tourId,
            departureDate: input.departureDate,
            numberOfGuests: input.numberOfGuests,
            message,
          },
          select: {
            referenceCode: true,
          },
        });
        return inquiry.referenceCode;
      } catch (error) {
        const isDuplicateCode =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.includes("referenceCode");
        if (isDuplicateCode) {
          continue;
        }
        if (isDatabaseUnavailableError(error)) {
          break;
        }
        throw error;
      }
    }
  } catch {
    // Không làm fail luồng trả 409 cho khách nếu tạo inquiry lỗi.
  }

  try {
    const inquiry = await saveContactInquiry({
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      tourId: input.tourId,
      departureDate: input.departureDate.toISOString(),
      numberOfGuests: input.numberOfGuests,
      message,
    });
    return inquiry.referenceCode;
  } catch {
    return null;
  }
}

function parseDateInput(value?: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDepartureDate(value?: string) {
  const date = parseDateInput(value);
  if (!date) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    // undefined thể hiện "input có giá trị nhưng sai nghiệp vụ".
    return undefined;
  }

  return date;
}

function getUtcDayRange(date: Date) {
  // Gom booking theo đúng ngày khởi hành (UTC) để tính tồn chỗ.
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

// FLOW: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // STEP 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // STEP 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // STEP 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // STEP 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Chỉ user đã đăng nhập và không bị khóa mới được đặt tour.
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để đặt tour.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:booking:create:${session.user.id}:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 10,
  });
  if (!rate.allowed) {
    // Trả Retry-After để frontend biết thời gian chờ.
    return NextResponse.json(
      { message: "Bạn thao tác quá nhanh. Vui lòng thử đặt tour lại sau ít phút." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const json = await parseJsonBody(request, "Dữ liệu đặt tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = bookingSchema.safeParse(json.data);
  if (!parsed.success) {
    // Trả lỗi đầu tiên để thông báo rõ ràng, tránh spam nhiều lỗi cùng lúc.
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu đặt tour không hợp lệ." },
      { status: 400 },
    );
  }

  const guestsFrom8 = parsed.data.guestsFrom8 ?? parsed.data.numberOfGuests;
  const child5To7Guests = parsed.data.child5To7Guests ?? 0;
  const childUnder5Guests = parsed.data.childUnder5Guests ?? 0;
  const totalGuests = guestsFrom8 + child5To7Guests + childUnder5Guests;
  if (totalGuests !== parsed.data.numberOfGuests) {
    return NextResponse.json(
      { message: "Tổng số khách không khớp với cơ cấu độ tuổi." },
      { status: 400 },
    );
  }
  const departureDate = parseDepartureDate(parsed.data.departureDate);
  if (departureDate === undefined) {
    // undefined nghĩa là ngày đã qua, null nghĩa là user bỏ trống.
    return NextResponse.json(
      { message: "Ngày khởi hành phải từ hôm nay trở đi." },
      { status: 400 },
    );
  }
  if (departureDate === null) {
    return NextResponse.json(
      { message: "Vui lòng chọn ngày khởi hành để kiểm tra chỗ trống." },
      { status: 400 },
    );
  }

  try {
    const tour = await db.tour.findUnique({
      where: { id: parsed.data.tourId },
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        discountPrice: true,
        maxGuests: true,
      },
    });

    if (!tour || tour.status !== TourStatus.ACTIVE) {
      // Không cho đặt tour đã ẩn/ngừng hoạt động.
      return NextResponse.json(
        { message: "Tour không tồn tại hoặc đã ngừng nhận đặt." },
        { status: 404 },
      );
    }

    if (totalGuests > tour.maxGuests) {
      // Chặn vượt số khách tối đa cho 1 booking.
      return NextResponse.json(
        {
          message: `Tour này chỉ nhận tối đa ${tour.maxGuests} khách cho một đơn đặt.`,
        },
        { status: 400 },
      );
    }

    const unitPrice = tour.discountPrice ?? tour.price;
    const totalPrice = Math.round(
      unitPrice *
        (guestsFrom8 + child5To7Guests * CHILD_5_TO_7_PRICE_RATIO + childUnder5Guests * CHILD_UNDER_5_PRICE_RATIO),
    );
    const booking = await db.$transaction(
      async (tx) => {
        const { start, end } = getUtcDayRange(departureDate);
        const occupied = await tx.booking.aggregate({
          where: {
            tourId: tour.id,
            status: {
              not: "CANCELLED",
            },
            departureDate: {
              gte: start,
              lt: end,
            },
          },
          _sum: {
            numberOfGuests: true,
          },
        });

        const bookedGuests = occupied._sum.numberOfGuests ?? 0;
        const remainingBeforeBooking = Math.max(tour.maxGuests - bookedGuests, 0);
        if (totalGuests > remainingBeforeBooking) {
          return {
            rejected: true as const,
            remainingSeats: remainingBeforeBooking,
          };
        }

        const bookingCode = await getUniqueBookingCodeTx(tx);
        const baseCreateData = {
          bookingCode,
          userId: session.user.id,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          totalPrice,
          departureDate,
        };
        let created: { id: string; bookingCode: string; totalPrice: number };
        try {
          created = await tx.booking.create({
            data: {
              ...baseCreateData,
              guestsFrom8,
              child5To7Guests,
              childUnder5Guests,
            },
            select: {
              id: true,
              bookingCode: true,
              totalPrice: true,
            },
          });
        } catch (createError) {
          if (!isGuestBreakdownPersistenceError(createError)) {
            throw createError;
          }
          // Tương thích ngược: DB/Prisma cũ chưa có 3 cột breakdown vẫn cho đặt tour.
          created = await tx.booking.create({
            data: baseCreateData,
            select: {
              id: true,
              bookingCode: true,
              totalPrice: true,
            },
          });
        }

        return {
          rejected: false as const,
          remainingSeats: Math.max(remainingBeforeBooking - totalGuests, 0),
          booking: created,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    if (booking.rejected) {
      const inquiryReferenceCode = await createCapacityShortageInquiry({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        tourId: tour.id,
        departureDate,
        numberOfGuests: totalGuests,
        remainingSeats: booking.remainingSeats,
      });
      return NextResponse.json(
        {
          message:
            booking.remainingSeats > 0
              ? `Tour chỉ còn ${booking.remainingSeats} chỗ cho ngày khởi hành đã chọn.`
              : "Tour đã hết chỗ cho ngày khởi hành đã chọn.",
          remainingSeats: booking.remainingSeats,
          inquiryReferenceCode,
          adminNotified: Boolean(inquiryReferenceCode),
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: `Đặt tour thành công. Mã đơn của bạn là ${booking.booking.bookingCode}.`,
        booking: booking.booking,
        remainingSeats: booking.remainingSeats,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      // Chế độ demo dự phòng: DB lỗi vẫn cho thao tác để không đứt luồng demo.
      const duPhongBooking = await demoCreatePublicBooking({
        userId: session.user.id,
        tourId: parsed.data.tourId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        numberOfGuests: totalGuests,
        guestsFrom8,
        child5To7Guests,
        childUnder5Guests,
        note: parsed.data.note,
        departureDate: parsed.data.departureDate,
      });

      if (duPhongBooking === "MAX_GUEST_EXCEEDED") {
        return NextResponse.json(
          { message: "Số khách vượt quá giới hạn của tour." },
          { status: 400 },
        );
      }
      if (duPhongBooking === "MISSING_DEPARTURE_DATE") {
        return NextResponse.json(
          { message: "Vui lòng chọn ngày khởi hành để kiểm tra chỗ trống." },
          { status: 400 },
        );
      }
      if (duPhongBooking === "PAST_DEPARTURE_DATE") {
        return NextResponse.json(
          { message: "Ngày khởi hành phải từ hôm nay trở đi." },
          { status: 400 },
        );
      }
      if (duPhongBooking === "INVALID_GUEST_BREAKDOWN") {
        return NextResponse.json(
          { message: "Tổng số khách không khớp với cơ cấu độ tuổi." },
          { status: 400 },
        );
      }
      if (duPhongBooking === "TOUR_FULL") {
        const inquiryReferenceCode = await createCapacityShortageInquiry({
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          tourId: parsed.data.tourId,
          departureDate,
          numberOfGuests: totalGuests,
          remainingSeats: 0,
        });
        return NextResponse.json(
          {
            message: "Tour đã hết chỗ cho ngày khởi hành đã chọn.",
            remainingSeats: 0,
            inquiryReferenceCode,
            adminNotified: Boolean(inquiryReferenceCode),
          },
          { status: 409 },
        );
      }
      if (
        duPhongBooking &&
        typeof duPhongBooking === "object" &&
        "code" in duPhongBooking &&
        duPhongBooking.code === "INSUFFICIENT_SEATS"
      ) {
        const inquiryReferenceCode = await createCapacityShortageInquiry({
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          tourId: parsed.data.tourId,
          departureDate,
          numberOfGuests: totalGuests,
          remainingSeats: duPhongBooking.remainingSeats,
        });
        return NextResponse.json(
          {
            message: "Số khách vượt quá số chỗ còn lại của tour cho ngày đã chọn.",
            remainingSeats: duPhongBooking.remainingSeats,
            inquiryReferenceCode,
            adminNotified: Boolean(inquiryReferenceCode),
          },
          { status: 409 },
        );
      }

      if (!duPhongBooking) {
        return NextResponse.json(
          { message: "Không thể xử lý đặt tour ở chế độ dự phòng." },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          message: `Đặt tour thành công. Mã đơn của bạn là ${duPhongBooking.bookingCode}.`,
          booking: {
            id: duPhongBooking.id,
            bookingCode: duPhongBooking.bookingCode,
            totalPrice: duPhongBooking.totalPrice,
          },
          remainingSeats: duPhongBooking.remainingSeats,
        },
        { status: 201 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // P2002: unique constraint (thường do trùng bookingCode).
      return NextResponse.json(
        { message: "Có lỗi trùng mã đặt tour, vui lòng thử lại." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Không thể xử lý đặt tour lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}







