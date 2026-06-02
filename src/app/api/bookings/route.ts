// Xử lý logic API Đặt Tour: Xác thực quyền, validate form dữ liệu đầu vào.
// Kiểm tra số lượng chỗ trống bằng Transaction và tự động lưu form yêu cầu tư vấn nếu hết chỗ.

import { Prisma, TourStatus, UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { demoCreatePublicBooking } from "@/lib/demo/admin-demo-store";
import { saveContactInquiry } from "@/lib/demo/contact-inquiry-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { resolveSingleRoomSurchargePerAdult } from "@/lib/pricing/single-room-surcharge";
import { buildCapacityShortageMessage } from "@/lib/utils/capacity-shortage-inquiry";
import { bookingSchema } from "@/lib/validations/booking";

const CHILD_5_TO_7_PRICE_RATIO = 0.5;
const CHILD_UNDER_5_PRICE_RATIO = 0;

type BookingTourPricing = {
  id: string;
  title: string;
  status: TourStatus;
  price: number;
  discountPrice: number | null;
  durationNights: number;
  maxGuests: number;
};

type BookingActor = {
  id: string;
  status: UserStatus;
};

// Tìm kiếm user bằng Session ID (mặc định), nếu lỗi sẽ fallback tìm bằng Email để đảm bảo luồng đặt tour không bị đứt đoạn.
async function resolveBookingActor(input: { id?: string | null; email?: string | null }) {
  const sessionId = input.id?.trim();
  // Ưu tiên 1: Tìm user theo sessionId trong cơ sở dữ liệu.
  if (sessionId && sessionId !== "dev-admin") {
    const byId = await db.user.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
      },
    });
    if (byId) {
      return byId satisfies BookingActor;
    }
  }

  const email = input.email?.trim().toLowerCase();
  // Ưu tiên 2 (Fallback): Nếu không có sessionId hợp lệ, tìm user qua email.
  if (email) {
    const byEmail = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
      },
    });
    if (byEmail) {
      return byEmail satisfies BookingActor;
    }
  }

  // Trả về null nếu không tìm thấy user nào hợp lệ, API sẽ chặn lại.
  return null;
}

// Nhận diện lỗi Prisma khi database chưa đồng bộ các cột phân tích độ tuổi khách (schema Booking cũ).
function isGuestBreakdownPersistenceError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
    return true;
  }
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Unknown argument `guestsFrom8`") ||
    message.includes("Unknown argument `child5To7Guests`") ||
    message.includes("Unknown argument `childUnder5Guests`") ||
    message.includes("Unknown argument `roomType`") ||
    message.includes("Unknown argument `baseGuestTotal`") ||
    message.includes("Unknown argument `roomSurchargeTotal`") ||
    message.includes("Unknown argument `unitPriceSnapshot`") ||
    message.includes("Unknown argument `discountPriceSnapshot`") ||
    message.includes("Unknown argument `child5To7RatioSnapshot`") ||
    message.includes("Unknown argument `childUnder5RatioSnapshot`") ||
    message.includes("Unknown argument `singleRoomSurchargePerAdultSnapshot`") ||
    message.includes("Unknown argument `durationNightsSnapshot`") ||
    message.includes("Unknown argument `pickupMethod`") ||
    message.includes("Unknown argument `pickupLocation`") ||
    message.includes("Unknown argument `departureDate`") ||
    message.includes("Unknown argument `paymentMethod`") ||
    message.includes("Unknown argument `paymentStatus`") ||
    message.includes("Unknown argument `status`") ||
    message.includes("Invalid value for argument `roomType`") ||
    message.includes("Invalid value for argument `paymentStatus`") ||
    message.includes("Invalid value for argument `status`") ||
    message.includes("Argument `status` is missing") ||
    message.includes("Argument `paymentStatus` is missing") ||
    message.includes("Argument `paymentMethod` is missing") ||
    message.includes("The column") && message.includes("does not exist")
  );
}

// Dùng để bắt các lỗi tương thích (fallback) khi database cũ thiếu cột phụ thu hoặc trạng thái thanh toán.
function isCompatibilitySchemaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
    return true;
  }

  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Unknown column") ||
    message.includes("The column") && message.includes("does not exist") ||
    message.includes("Unknown argument `guestsFrom8`") ||
    message.includes("Unknown argument `child5To7Guests`") ||
    message.includes("Unknown argument `childUnder5Guests`") ||
    message.includes("Unknown argument `roomType`") ||
    message.includes("Unknown argument `baseGuestTotal`") ||
    message.includes("Unknown argument `roomSurchargeTotal`") ||
    message.includes("Unknown argument `unitPriceSnapshot`") ||
    message.includes("Unknown argument `discountPriceSnapshot`") ||
    message.includes("Unknown argument `child5To7RatioSnapshot`") ||
    message.includes("Unknown argument `childUnder5RatioSnapshot`") ||
    message.includes("Unknown argument `singleRoomSurchargePerAdultSnapshot`") ||
    message.includes("Unknown argument `durationNightsSnapshot`") ||
    message.includes("Unknown argument `pickupMethod`") ||
    message.includes("Unknown argument `pickupLocation`") ||
    message.includes("Unknown argument `paymentMethod`") ||
    message.includes("Unknown argument `paymentStatus`") ||
    message.includes("Unknown argument `status`") ||
    message.includes("Invalid value for argument `roomType`") ||
    message.includes("Invalid value for argument `paymentStatus`") ||
    message.includes("Invalid value for argument `status`") ||
    message.includes("Argument `status` is missing") ||
    message.includes("Argument `paymentStatus` is missing") ||
    message.includes("Argument `paymentMethod` is missing") ||
    message.includes("Unknown argument `departureDate`") ||
    message.includes("Unknown argument `singleRoomSurchargePerAdult`") ||
    message.includes("Field '") && message.includes("doesn't have a default value")
  );
}

// Tạo mã Booking ngẫu nhiên (VD: TB2024...) dùng để admin quản lý và khách hàng tra cứu đơn.
function buildBookingCode() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TB${yyyy}${mm}${dd}${random}`;
}

// Tạo mã Tư vấn ngẫu nhiên (VD: TV2024...) dùng để phân biệt các form khách để lại.
function buildInquiryReferenceCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TV${yy}${mm}${dd}${random}`;
}

// Kiểm tra chống trùng mã booking trực tiếp trong Transaction (tránh lỗi conflict khi nhiều đơn tạo cùng lúc).
async function getUniqueBookingCodeTx(tx: Prisma.TransactionClient) {
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

// Tự động chuyển đổi thành form Tư vấn nếu tour hết chỗ, giúp đội Sale giữ liên lạc với khách.
async function createCapacityShortageInquiry(input: {
  fullName: string;
  email: string;
  phone: string;
  tourId: string;
  tourTitle?: string;
  departureDate: Date;
  numberOfGuests: number;
  remainingSeats: number;
}) {
  // Tạo tự động nội dung tin nhắn báo hết chỗ cho khách hàng.
  const message = buildCapacityShortageMessage({
    tourTitle: input.tourTitle ?? "",
    departureDate: input.departureDate,
    requestedGuests: input.numberOfGuests,
    remainingSeats: input.remainingSeats,
  });

  try {
    // Vòng lặp thử tạo bản ghi Tư vấn tối đa 5 lần để tránh lỗi trùng mã ngẫu nhiên.
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
        // Bắt lỗi Prisma P2002 (trùng ReferenceCode) để thử lại với mã mới.
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
  }

  try {
    // Fallback: Nếu CSDL lỗi, lưu tạm form vào localStorage/bộ nhớ tạm để không mất lead.
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

// Kiểm tra định dạng ngày tháng đầu vào (bắt buộc yyyy-mm-dd) để tránh lỗi parse lỗi từ client.
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
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

// Đảm bảo khách hàng không đặt tour vào một ngày đã qua (so sánh với hôm nay).
function parseDepartureDate(value?: string) {
  const date = parseDateInput(value);
  if (!date) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return undefined;
  }

  return date;
}

// Xử lý chuyển đổi thời gian sang múi giờ Việt Nam (UTC+7) 
// để truy vấn chính xác các booking trong cùng một ngày.
function toDateKeyUtc7(value: Date) {
  const shifted = new Date(value.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

// Lấy ra khoảng thời gian (start, end) của một ngày theo múi giờ UTC+7 để query Database.
function getUtc7DayRange(date: Date) {
  const dayKey = toDateKeyUtc7(date);
  const [year, month, day] = dayKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function POST(request: Request) {
  // Kiểm tra đăng nhập: Chặn các user chưa đăng nhập hoặc token hết hạn để bảo mật API.
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để đặt tour.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  // Parse body: Đọc dữ liệu JSON gửi lên từ Client một cách an toàn.
  const json = await parseJsonBody(request, "Dữ liệu đặt tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  // Chuẩn hóa điểm đón (pickupLocation) phòng trường hợp client gửi null.
  const normalizedInput =
    json.data && typeof json.data === "object"
      ? {
          ...json.data,
          pickupLocation:
            "pickupLocation" in json.data && (json.data as { pickupLocation?: unknown }).pickupLocation === null
              ? ""
              : (json.data as { pickupLocation?: unknown }).pickupLocation,
        }
      : json.data;

  // Validate dữ liệu: Dùng schema Zod để kiểm tra tính hợp lệ (ví dụ: format email, số điện thoại...).
  const parsed = bookingSchema.safeParse(normalizedInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu đặt tour không hợp lệ." },
      { status: 400 },
    );
  }

  // Lấy chi tiết số lượng khách theo từng độ tuổi, loại phòng và điểm đón để tính giá.
  const guestsFrom8 = parsed.data.guestsFrom8 ?? parsed.data.numberOfGuests;
  const child5To7Guests = parsed.data.child5To7Guests ?? 0;
  const childUnder5Guests = parsed.data.childUnder5Guests ?? 0;
  const roomType = parsed.data.roomType ?? "DOUBLE";
  const requestedSingleRoomGuests =
    typeof parsed.data.singleRoomGuests === "number" ? parsed.data.singleRoomGuests : undefined;
  const pickupMethod = parsed.data.pickupMethod ?? "SELF_ARRIVAL";
  const pickupLocation =
    pickupMethod === "NEED_PICKUP" ? parsed.data.pickupLocation?.trim() || null : null;
  const totalGuests = guestsFrom8 + child5To7Guests + childUnder5Guests;
  // Kiểm tra tổng số khách gửi lên có khớp với tổng chi tiết từng độ tuổi hay không.
  if (totalGuests !== parsed.data.numberOfGuests) {
    return NextResponse.json(
      { message: "Tổng số khách không khớp với cơ cấu độ tuổi." },
      { status: 400 },
    );
  }
  // Kiểm tra ngày khởi hành: Đảm bảo khách không đặt tour vào ngày đã qua.
  const departureDate = parseDepartureDate(parsed.data.departureDate);
  if (departureDate === undefined) {
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
    // Lấy thông tin user: Gắn mã ID người dùng hiện hành vào đơn đặt tour để quản lý.
    const actor = await resolveBookingActor({
      id: session.user.id,
      email: session.user.email,
    });
    if (!actor) {
      return NextResponse.json(
        { message: "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng xuất và đăng nhập lại." },
        { status: 401 },
      );
    }
    if (actor.status === UserStatus.BLOCKED) {
      return NextResponse.json(
        { message: "Tài khoản của bạn đã bị khóa." },
        { status: 403 },
      );
    }

    // Rate limit chống spam: Giới hạn tần suất gọi API từ cùng 1 IP/User để tránh bị đối thủ dùng bot spam kín chỗ.
    const bookingUserId = actor.id;
    const ip = getClientIp(request);
    const rate = consumeRateLimit(`public:booking:create:${bookingUserId}:${ip}`, {
      windowMs: 15 * 60 * 1000,
      max: 10,
    });
    if (!rate.allowed) {
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

    // Lấy thông tin tour: Lấy giá gốc, giá khuyến mãi và sức chứa tối đa của tour từ cơ sở dữ liệu.
    const tourRaw = await db.tour.findUnique({
      where: { id: parsed.data.tourId },
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        discountPrice: true,
        durationNights: true,
        maxGuests: true,
      } as unknown as Prisma.TourSelect,
    });
    const tour = tourRaw as unknown as BookingTourPricing | null;

    // Kiểm tra xem Tour có tồn tại và đang ở trạng thái ACTIVE (mở bán) hay không.
    if (!tour || tour.status !== TourStatus.ACTIVE) {
      return NextResponse.json(
        { message: "Tour không tồn tại hoặc đã ngừng nhận đặt." },
        { status: 404 },
      );
    }

    // Kiểm tra số khách trong 1 đơn không được vượt quá số chỗ tối đa của tour.
    if (totalGuests > tour.maxGuests) {
      return NextResponse.json(
        {
          message: `Tour này chỉ nhận tối đa ${tour.maxGuests} khách cho một đơn đặt.`,
        },
        { status: 400 },
      );
    }

    // Tính giá tour: Tính toán tổng tiền dựa trên giá vé, phụ thu phòng đơn và các chính sách chiết khấu trẻ em.
    const unitPrice = tour.discountPrice ?? tour.price;
    // Truy vấn CSDL để lấy mức phụ thu phòng đơn (nếu có) của tour này.
    const surchargeRows = (await db.$queryRawUnsafe(
      "SELECT `singleRoomSurchargePerAdult` FROM `Tour` WHERE `id` = ? LIMIT 1",
      tour.id,
    ).catch((error) => {
      if (isCompatibilitySchemaError(error)) {
        return [] as Array<{ singleRoomSurchargePerAdult?: number | bigint | null }>;
      }
      throw error;
    })) as Array<{ singleRoomSurchargePerAdult?: number | bigint | null }>;
    const singleRoomSurchargePerAdult = resolveSingleRoomSurchargePerAdult({
      durationNights: tour.durationNights,
      unitPrice,
      configuredSurcharge: surchargeRows[0]?.singleRoomSurchargePerAdult ?? 0,
    });

    // Chặn lỗi nghiệp vụ: Khách chọn phòng đơn nhưng tour không đi qua đêm.
    if (roomType === "SINGLE" && tour.durationNights <= 0) {
      return NextResponse.json(
        { message: "Tour không áp dụng loại phòng đơn." },
        { status: 400 },
      );
    }
    const normalizedSingleRoomGuests =
      typeof requestedSingleRoomGuests === "number" && Number.isFinite(requestedSingleRoomGuests)
        ? Math.trunc(requestedSingleRoomGuests)
        : totalGuests;
    const singleRoomGuests =
      roomType === "SINGLE"
        ? Math.max(1, Math.min(totalGuests, normalizedSingleRoomGuests))
        : 0;
    // Tính tổng tiền cơ bản dựa trên cơ cấu khách (người lớn 100%, trẻ 5-7 tuổi 50%, trẻ <5 tuổi miễn phí).
    const baseGuestTotal = Math.round(
      unitPrice *
        (guestsFrom8 +
          child5To7Guests * CHILD_5_TO_7_PRICE_RATIO +
          childUnder5Guests * CHILD_UNDER_5_PRICE_RATIO),
    );
    // Tính tổng tiền phụ thu phòng đơn nếu khách yêu cầu ở phòng riêng.
    const roomSurchargeTotal =
      roomType === "SINGLE"
        ? Math.round(singleRoomGuests * singleRoomSurchargePerAdult * tour.durationNights)
        : 0;
    // Tính tổng chi phí cuối cùng (cơ bản + phụ thu).
    const totalPrice = baseGuestTotal + roomSurchargeTotal;
    // Transaction kiểm tra chỗ và tạo booking: Bọc trong Transaction để đảm bảo tính toàn vẹn dữ liệu. Nếu trừ ghế trống thành công thì mới tạo booking, nếu lỗi sẽ tự động Rollback.
    const booking = await db.$transaction(
      async (tx) => {
        // Lấy giới hạn thời gian trong ngày (từ 0h đến 24h) theo giờ Việt Nam để query DB.
        const { start, end } = getUtc7DayRange(departureDate);
        // Chuẩn bị nhiều cách query để tương thích ngược với schema cũ (khi chưa có trường trạng thái).
        const aggregateAttempts: Array<Prisma.BookingAggregateArgs["where"]> = [
          {
            tourId: tour.id,
            status: {
              not: "CANCELLED",
            },
            departureDate: {
              gte: start,
              lt: end,
            },
          },
          {
            tourId: tour.id,
            departureDate: {
              gte: start,
              lt: end,
            },
          },
          {
            tourId: tour.id,
            status: {
              not: "CANCELLED",
            },
          },
          {
            tourId: tour.id,
          },
        ];
        let occupied: { _sum: { numberOfGuests: number | null } } | null = null;
        let lastAggregateError: unknown;

        // Thử query số lượng chỗ đã đặt theo từng kịch bản, dừng lại ở query đầu tiên thành công.
        for (const aggregateWhere of aggregateAttempts) {
          try {
            occupied = await tx.booking.aggregate({
              where: aggregateWhere,
              _sum: {
                numberOfGuests: true,
              },
            });
            break;
          } catch (aggregateError) {
            lastAggregateError = aggregateError;
            if (!isCompatibilitySchemaError(aggregateError)) {
              throw aggregateError;
            }
          }
        }

        if (!occupied) {
          throw lastAggregateError;
        }
        // Tính toán số chỗ đã đặt và số chỗ còn lại thực tế của tour trong ngày.
        const bookedGuests = occupied._sum.numberOfGuests ?? 0;
        const remainingBeforeBooking = Math.max(tour.maxGuests - bookedGuests, 0);
        // Nếu tổng số khách (cũ + mới) vượt quá số chỗ trống, từ chối tạo booking.
        if (totalGuests > remainingBeforeBooking) {
          return {
            rejected: true as const,
            remainingSeats: remainingBeforeBooking,
          };
        }

        // Sinh mã Booking duy nhất và chuẩn bị dữ liệu lưu xuống Database.
        const bookingCode = await getUniqueBookingCodeTx(tx);
        // Chuẩn bị cấu trúc dữ liệu cơ bản chung cho bản ghi Booking.
        const baseCreateData = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          status: "PENDING",
          paymentMethod: "Thanh toán khi xác nhận",
          paymentStatus: "UNPAID",
          pickupMethod,
          pickupLocation,
          roomType,
          baseGuestTotal,
          roomSurchargeTotal,
          unitPriceSnapshot: unitPrice,
          discountPriceSnapshot: tour.discountPrice,
          child5To7RatioSnapshot: CHILD_5_TO_7_PRICE_RATIO,
          childUnder5RatioSnapshot: CHILD_UNDER_5_PRICE_RATIO,
          singleRoomSurchargePerAdultSnapshot: singleRoomSurchargePerAdult,
          durationNightsSnapshot: tour.durationNights,
          totalPrice,
          departureDate,
        };
        const createDataWithBreakdown = {
          ...baseCreateData,
          guestsFrom8,
          child5To7Guests,
          childUnder5Guests,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        // Chuẩn bị dữ liệu dự phòng (Legacy) dành cho database cũ chưa migrate đủ cột.
        const createDataLegacy = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          status: "PENDING",
          paymentMethod: "Thanh toán khi xác nhận",
          paymentStatus: "UNPAID",
          pickupMethod,
          pickupLocation,
          totalPrice,
          departureDate,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        const createDataLegacyWithoutDepartureDate = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          status: "PENDING",
          paymentMethod: "Thanh toán khi xác nhận",
          paymentStatus: "UNPAID",
          totalPrice,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        const createDataLegacyWithoutPaymentStatus = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          status: "PENDING",
          paymentMethod: "Thanh toán khi xác nhận",
          pickupMethod,
          pickupLocation,
          totalPrice,
          departureDate,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        const createDataLegacyWithoutPaymentStatusAndDepartureDate = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          status: "PENDING",
          paymentMethod: "Thanh toán khi xác nhận",
          pickupMethod,
          pickupLocation,
          totalPrice,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        const createDataLegacyWithPaymentMethodOnly = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          paymentMethod: "Thanh toán khi xác nhận",
          totalPrice,
          departureDate,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        const createDataLegacyWithPaymentMethodOnlyWithoutDepartureDate = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          paymentMethod: "Thanh toán khi xác nhận",
          totalPrice,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        const createDataLegacyMinimal = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          totalPrice,
          departureDate,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        const createDataLegacyMinimalWithoutDepartureDate = {
          bookingCode,
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          totalPrice,
        } as unknown as Prisma.BookingUncheckedCreateInput;
        // Danh sách các phiên bản dữ liệu Booking để thử tạo, từ đầy đủ nhất đến cũ nhất.
        const createAttempts: Prisma.BookingUncheckedCreateInput[] = [
          createDataWithBreakdown,
          createDataLegacy,
          createDataLegacyWithoutDepartureDate,
          createDataLegacyWithoutPaymentStatus,
          createDataLegacyWithoutPaymentStatusAndDepartureDate,
          createDataLegacyWithPaymentMethodOnly,
          createDataLegacyWithPaymentMethodOnlyWithoutDepartureDate,
          createDataLegacyMinimal,
          createDataLegacyMinimalWithoutDepartureDate,
        ];
        let created: { id: string; bookingCode: string; totalPrice: number } | null = null;
        let lastCreateError: unknown;

        // Thử tạo booking theo từng phiên bản dữ liệu, bỏ qua các lỗi schema chưa đồng bộ.
        for (const data of createAttempts) {
          try {
            // Dùng Prisma Transaction để đảm bảo tính toàn vẹn dữ liệu
            // Tránh trường hợp bị âm chỗ nếu có lỗi xảy ra giữa chừng khi tạo booking
            created = await tx.booking.create({
              data,
              select: {
                id: true,
                bookingCode: true,
                totalPrice: true,
              },
            });
            break;
          } catch (createError) {
            lastCreateError = createError;
            if (!isGuestBreakdownPersistenceError(createError) && !isCompatibilitySchemaError(createError)) {
              throw createError;
            }
          }
        }

        if (!created) {
          throw lastCreateError;
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

    // Xử lý khi đặt tour thất bại do hết chỗ: Gọi hàm lưu form tự động.
    if (booking.rejected) {
      const inquiryReferenceCode = await createCapacityShortageInquiry({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        tourId: tour.id,
        tourTitle: tour.title,
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

    // Trả về thông tin đơn đặt tour thành công cho client.
    return NextResponse.json(
      {
        message: `Đặt tour thành công. Mã đơn của bạn là ${booking.booking.bookingCode}.`,
        booking: booking.booking,
        remainingSeats: booking.remainingSeats,
        pricing: {
          roomType,
          singleRoomGuests,
          baseGuestTotal,
          roomSurchargeTotal,
          totalPrice,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    // Fallback: Nếu CSDL lỗi, ghi tạm dữ liệu booking vào memory để không làm đứt luồng trải nghiệm của người dùng.
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
        roomType,
        singleRoomGuests: requestedSingleRoomGuests,
          note: parsed.data.note,
          pickupMethod,
          pickupLocation,
          departureDate: parsed.data.departureDate,
      });

      // Lỗi: Số lượng khách yêu cầu vượt quá sức chứa tối đa của tour.
      if (duPhongBooking === "MAX_GUEST_EXCEEDED") {
        return NextResponse.json(
          { message: "Số khách vượt quá giới hạn của tour." },
          { status: 400 },
        );
      }
      // Lỗi: Khách chưa chọn ngày khởi hành.
      if (duPhongBooking === "MISSING_DEPARTURE_DATE") {
        return NextResponse.json(
          { message: "Vui lòng chọn ngày khởi hành để kiểm tra chỗ trống." },
          { status: 400 },
        );
      }
      // Lỗi: Khách chọn ngày khởi hành trong quá khứ.
      if (duPhongBooking === "PAST_DEPARTURE_DATE") {
        return NextResponse.json(
          { message: "Ngày khởi hành phải từ hôm nay trở đi." },
          { status: 400 },
        );
      }
      // Lỗi: Tổng số lượng khách không khớp với chi tiết người lớn/trẻ em.
      if (duPhongBooking === "INVALID_GUEST_BREAKDOWN") {
        return NextResponse.json(
          { message: "Tổng số khách không khớp với cơ cấu độ tuổi." },
          { status: 400 },
        );
      }
      // Lỗi: Khách yêu cầu phòng đơn nhưng tour không đi qua đêm.
      if (duPhongBooking === "INVALID_ROOM_TYPE") {
        return NextResponse.json(
          { message: "Tour không áp dụng loại phòng đơn." },
          { status: 400 },
        );
      }
      // Lỗi: Tour đã hết sạch chỗ, tiến hành tạo form yêu cầu tư vấn.
      if (duPhongBooking === "TOUR_FULL") {
        const inquiryReferenceCode = await createCapacityShortageInquiry({
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          tourId: parsed.data.tourId,
          tourTitle: "Không rõ tour",
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
      // Lỗi: Tour còn chỗ nhưng không đủ cho số lượng khách yêu cầu, tạo form yêu cầu tư vấn báo số chỗ còn lại.
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
          tourTitle: "Không rõ tour",
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

      // Trả về kết quả đặt tour thành công từ chế độ dự phòng.
      return NextResponse.json(
        {
          message: `Đặt tour thành công. Mã đơn của bạn là ${duPhongBooking.bookingCode}.`,
          booking: {
            id: duPhongBooking.id,
            bookingCode: duPhongBooking.bookingCode,
            totalPrice: duPhongBooking.totalPrice,
          },
          remainingSeats: duPhongBooking.remainingSeats,
          pricing: {
            roomType,
            singleRoomGuests: roomType === "SINGLE" ? requestedSingleRoomGuests ?? guestsFrom8 : 0,
            baseGuestTotal: duPhongBooking.baseGuestTotal ?? null,
            roomSurchargeTotal: duPhongBooking.roomSurchargeTotal ?? null,
          },
        },
        { status: 201 },
      );
    }

    // Xử lý lỗi Prisma P2002: Trùng mã bookingCode do nhiều người đặt cùng lúc.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // P2002: unique constraint (thường do trùng bookingCode).
      return NextResponse.json(
        { message: "Có lỗi trùng mã đặt tour, vui lòng thử lại." },
        { status: 409 },
      );
    }

    // Xử lý lỗi Prisma P2003: Lỗi khóa ngoại (ví dụ user bị xóa trong quá trình đặt).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      const fieldName = String(error.meta?.field_name ?? "");
      if (fieldName.toLowerCase().includes("userid")) {
        return NextResponse.json(
          { message: "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại để đặt tour." },
          { status: 401 },
        );
      }
    }

    // Xử lý lỗi schema Prisma không khớp (thường do migrate thiếu).
    if (isCompatibilitySchemaError(error)) {
      return NextResponse.json(
        { message: "CSDL chưa đồng bộ cấu trúc đặt tour. Vui lòng chạy migration rồi thử lại." },
        { status: 503 },
      );
    }

    console.error("Create booking failed:", error);

    // Bắt các lỗi hệ thống không xác định (Internal Server Error).
    return NextResponse.json(
      { message: "Không thể xử lý đặt tour lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}








