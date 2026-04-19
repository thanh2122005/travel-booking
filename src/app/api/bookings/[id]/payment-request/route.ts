import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import {
  getBookingPaymentMetadata,
  isBookingPaymentMetadataMigrationError,
  updateBookingPaymentMetadata,
} from "@/lib/db/booking-payment-metadata";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";
import { demoRequestPublicBookingPayment } from "@/lib/demo/admin-demo-store";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

type BookingPaymentRequestRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: BookingPaymentRequestRouteContext) {
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để xác nhận thanh toán.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:booking:payment-request:${session.user.id}:${ip}`, {
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
      return NextResponse.json({ message: "Không tìm thấy đơn đặt tour." }, { status: 404 });
    }
    if (booking.status === "CANCELLED") {
      return NextResponse.json({ message: "Đơn đã hủy nên không thể xác nhận thanh toán." }, { status: 400 });
    }

    const paymentMetadata = await getBookingPaymentMetadata(booking.id, db, { strict: true });
    if (booking.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({ message: "Đơn này đã được xác nhận thanh toán." }, { status: 409 });
    }
    if (paymentMetadata.paymentRequestedAt) {
      return NextResponse.json(
        { message: "Đơn đã gửi yêu cầu thanh toán, vui lòng chờ admin xác nhận." },
        { status: 409 },
      );
    }

    const requestedAt = new Date();
    await updateBookingPaymentMetadata(booking.id, {
      paymentRequestedAt: requestedAt,
    });

    return NextResponse.json({
      message: `Đã ghi nhận yêu cầu thanh toán cho đơn ${booking.bookingCode}. Admin sẽ xác nhận và phát hành vé sau khi kiểm tra.`,
      booking: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        paymentRequestedAt: requestedAt,
      },
    });
  } catch (error) {
    if (isBookingPaymentMetadataMigrationError(error)) {
      return NextResponse.json(
        { message: "CSDL chưa cập nhật chức năng xác nhận thanh toán. Vui lòng chạy migration mới." },
        { status: 503 },
      );
    }

    if (isDatabaseUnavailableError(error)) {
      const result = await demoRequestPublicBookingPayment({
        bookingId: id,
        userId: session.user.id,
      });

      if (result === "NOT_FOUND") {
        return NextResponse.json({ message: "Không tìm thấy đơn đặt tour." }, { status: 404 });
      }
      if (result === "NOT_ALLOWED") {
        return NextResponse.json({ message: "Đơn đã hủy nên không thể xác nhận thanh toán." }, { status: 400 });
      }
      if (result === "ALREADY_PAID") {
        return NextResponse.json({ message: "Đơn này đã được xác nhận thanh toán." }, { status: 409 });
      }
      if (result === "ALREADY_REQUESTED") {
        return NextResponse.json(
          { message: "Đơn đã gửi yêu cầu thanh toán, vui lòng chờ admin xác nhận." },
          { status: 409 },
        );
      }

      return NextResponse.json({
        message: `Đã ghi nhận yêu cầu thanh toán cho đơn ${result.bookingCode}. Admin sẽ xác nhận và phát hành vé sau khi kiểm tra.`,
        booking: {
          id: result.id,
          bookingCode: result.bookingCode,
          paymentRequestedAt: result.paymentRequestedAt,
        },
      });
    }

    return NextResponse.json(
      { message: "Không thể ghi nhận yêu cầu thanh toán lúc này." },
      { status: 500 },
    );
  }
}
