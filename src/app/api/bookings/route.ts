// TÓM TẮT API: src/app/api/bookings/route.ts
// Phạm vi: API public hoặc user đã đăng nhập.
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

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

async function resolveBookingActor(input: { id?: string | null; email?: string | null }) {
  const sessionId = input.id?.trim();
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

  return null;
}

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
  tourTitle?: string;
  departureDate: Date;
  numberOfGuests: number;
  remainingSeats: number;
}) {
  const message = buildCapacityShortageMessage({
    tourTitle: input.tourTitle ?? "",
    departureDate: input.departureDate,
    requestedGuests: input.numberOfGuests,
    remainingSeats: input.remainingSeats,
  });

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

function toDateKeyUtc7(value: Date) {
  const shifted = new Date(value.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function getUtc7DayRange(date: Date) {
  const dayKey = toDateKeyUtc7(date);
  const [year, month, day] = dayKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

// LUỒNG: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // BƯỚC 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // BƯỚC 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // BƯỚC 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Chỉ user đã đăng nhập và không bị khóa mới được đặt tour.
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để đặt tour.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  const json = await parseJsonBody(request, "Dữ liệu đặt tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

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

  const parsed = bookingSchema.safeParse(normalizedInput);
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
  const roomType = parsed.data.roomType ?? "DOUBLE";
  const requestedSingleRoomGuests =
    typeof parsed.data.singleRoomGuests === "number" ? parsed.data.singleRoomGuests : undefined;
  const pickupMethod = parsed.data.pickupMethod ?? "SELF_ARRIVAL";
  const pickupLocation =
    pickupMethod === "NEED_PICKUP" ? parsed.data.pickupLocation?.trim() || null : null;
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

    const bookingUserId = actor.id;
    const ip = getClientIp(request);
    const rate = consumeRateLimit(`public:booking:create:${bookingUserId}:${ip}`, {
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
    const baseGuestTotal = Math.round(
      unitPrice *
        (guestsFrom8 +
          child5To7Guests * CHILD_5_TO_7_PRICE_RATIO +
          childUnder5Guests * CHILD_UNDER_5_PRICE_RATIO),
    );
    const roomSurchargeTotal =
      roomType === "SINGLE"
        ? Math.round(singleRoomGuests * singleRoomSurchargePerAdult * tour.durationNights)
        : 0;
    const totalPrice = baseGuestTotal + roomSurchargeTotal;
    const booking = await db.$transaction(
      async (tx) => {
        const { start, end } = getUtc7DayRange(departureDate);
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
          userId: bookingUserId,
          tourId: tour.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          numberOfGuests: totalGuests,
          note: parsed.data.note || null,
          status: "PENDING",
          paymentMethod: "Thanh toan khi xac nhan",
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
          paymentMethod: "Thanh toan khi xac nhan",
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
          paymentMethod: "Thanh toan khi xac nhan",
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
          paymentMethod: "Thanh toan khi xac nhan",
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
          paymentMethod: "Thanh toan khi xac nhan",
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
          paymentMethod: "Thanh toan khi xac nhan",
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
          paymentMethod: "Thanh toan khi xac nhan",
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

        for (const data of createAttempts) {
          try {
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
      if (duPhongBooking === "INVALID_ROOM_TYPE") {
        return NextResponse.json(
          { message: "Tour không áp dụng loại phòng đơn." },
          { status: 400 },
        );
      }
      if (duPhongBooking === "TOUR_FULL") {
        const inquiryReferenceCode = await createCapacityShortageInquiry({
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          tourId: parsed.data.tourId,
          tourTitle: "Khong ro tour",
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
          tourTitle: "Khong ro tour",
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

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // P2002: unique constraint (thường do trùng bookingCode).
      return NextResponse.json(
        { message: "Có lỗi trùng mã đặt tour, vui lòng thử lại." },
        { status: 409 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      const fieldName = String(error.meta?.field_name ?? "");
      if (fieldName.toLowerCase().includes("userid")) {
        return NextResponse.json(
          { message: "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại để đặt tour." },
          { status: 401 },
        );
      }
    }

    if (isCompatibilitySchemaError(error)) {
      return NextResponse.json(
        { message: "CSDL chưa đồng bộ cấu trúc đặt tour. Vui lòng chạy migration rồi thử lại." },
        { status: 503 },
      );
    }

    console.error("Create booking failed:", error);

    return NextResponse.json(
      { message: "Không thể xử lý đặt tour lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}








