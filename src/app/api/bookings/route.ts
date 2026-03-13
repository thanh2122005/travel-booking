import { Prisma, TourStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { demoCreatePublicBooking } from "@/lib/demo/admin-demo-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { bookingSchema } from "@/lib/validations/booking";

function buildBookingCode() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TB${yyyy}${mm}${dd}${random}`;
}

async function getUniqueBookingCode() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const bookingCode = buildBookingCode();
    const existed = await db.booking.findUnique({
      where: { bookingCode },
      select: { id: true },
    });

    if (!existed) {
      return bookingCode;
    }
  }

  return `TB${Date.now()}`;
}

function parseDepartureDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return undefined;
  }

  return date;
}

export async function POST(request: Request) {
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

  const json = await parseJsonBody(request, "Du lieu dat tour khong hop le.");
  if (!json.ok) {
    return json.response;
  }
  const body = json.data;
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: firstIssue?.message ?? "Dữ liệu đặt tour không hợp lệ.",
      },
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
      return NextResponse.json(
        { message: "Tour không tồn tại hoặc đã ngừng nhận đặt." },
        { status: 404 },
      );
    }

    if (parsed.data.numberOfGuests > tour.maxGuests) {
      return NextResponse.json(
        {
          message: `Tour này chỉ nhận tối đa ${tour.maxGuests} khách cho một đơn đặt.`,
        },
        { status: 400 },
      );
    }

    const departureDate = parseDepartureDate(parsed.data.departureDate);
    if (departureDate === undefined) {
      return NextResponse.json(
        { message: "Ngày khởi hành phải từ hôm nay trở đi." },
        { status: 400 },
      );
    }

    const unitPrice = tour.discountPrice ?? tour.price;
    const totalPrice = unitPrice * parsed.data.numberOfGuests;
    const bookingCode = await getUniqueBookingCode();

    const booking = await db.booking.create({
      data: {
        bookingCode,
        userId: session.user.id,
        tourId: tour.id,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        numberOfGuests: parsed.data.numberOfGuests,
        note: parsed.data.note || null,
        totalPrice,
        departureDate: departureDate ?? null,
      },
      select: {
        id: true,
        bookingCode: true,
        totalPrice: true,
      },
    });

    return NextResponse.json(
      {
        message: `Đặt tour thành công. Mã đơn của bạn là ${booking.bookingCode}.`,
        booking,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const fallbackBooking = await demoCreatePublicBooking({
        userId: session.user.id,
        tourId: parsed.data.tourId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        numberOfGuests: parsed.data.numberOfGuests,
        note: parsed.data.note,
        departureDate: parsed.data.departureDate,
      });

      if (fallbackBooking === "MAX_GUEST_EXCEEDED") {
        return NextResponse.json(
          { message: "Số khách vượt quá giới hạn của tour." },
          { status: 400 },
        );
      }

      if (!fallbackBooking) {
        return NextResponse.json(
          { message: "Không thể xử lý đặt tour ở chế độ dự phòng." },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          message: `Đặt tour thành công. Mã đơn của bạn là ${fallbackBooking.bookingCode}.`,
          booking: {
            id: fallbackBooking.id,
            bookingCode: fallbackBooking.bookingCode,
            totalPrice: fallbackBooking.totalPrice,
          },
        },
        { status: 201 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          message: "Có lỗi trùng mã đặt tour, vui lòng thử lại.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Không thể xử lý đặt tour lúc này, vui lòng thử lại sau.",
      },
      { status: 500 },
    );
  }
}
