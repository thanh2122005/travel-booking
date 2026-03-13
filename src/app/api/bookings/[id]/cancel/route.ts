import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";
import { demoCancelPublicBooking } from "@/lib/demo/admin-demo-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { canCancelBooking } from "@/lib/utils/booking-actions";

type BookingCancelRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: BookingCancelRouteContext) {
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để hủy đơn.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  const ip = getClientIp(_request);
  const rate = consumeRateLimit(`public:booking:cancel:${session.user.id}:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 20,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const { id } = await context.params;

  try {
    const booking = await db.booking.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        bookingCode: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Không tìm thấy đơn đặt tour." },
        { status: 404 },
      );
    }

    if (!canCancelBooking(booking.status, booking.paymentStatus)) {
      return NextResponse.json(
        { message: "Đơn hiện tại không thể hủy trực tuyến." },
        { status: 400 },
      );
    }

    const updated = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
      },
      select: {
        id: true,
        bookingCode: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: `Đã hủy đơn ${updated.bookingCode}.`,
      booking: updated,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const result = await demoCancelPublicBooking({
        bookingId: id,
        userId: session.user.id,
      });

      if (result === "NOT_FOUND") {
        return NextResponse.json(
          { message: "Không tìm thấy đơn đặt tour." },
          { status: 404 },
        );
      }

      if (result === "NOT_ALLOWED") {
        return NextResponse.json(
          { message: "Đơn hiện tại không thể hủy trực tuyến." },
          { status: 400 },
        );
      }

      return NextResponse.json({
        message: `Đã hủy đơn ${result.bookingCode}.`,
        booking: {
          id: result.id,
          bookingCode: result.bookingCode,
          status: result.status,
        },
      });
    }

    return NextResponse.json(
      { message: "Không thể hủy đơn lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
