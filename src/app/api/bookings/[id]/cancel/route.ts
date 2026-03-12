import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";
import { demoCancelPublicBooking } from "@/lib/demo/admin-demo-store";
import { canCancelBooking } from "@/lib/utils/booking-actions";

type BookingCancelRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: BookingCancelRouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Vui lòng đăng nhập để hủy đơn." },
      { status: 401 },
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
