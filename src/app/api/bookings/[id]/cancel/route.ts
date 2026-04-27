// TÓM TẮT API: src/app/api/bookings/[id]/cancel/route.ts
// Phạm vi: API public hoặc user đã đăng nhập.
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";
import { demoCancelPublicBooking } from "@/lib/demo/admin-demo-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { evaluateCancelBooking } from "@/lib/utils/booking-actions";

type BookingCancelRouteContext = {
  params: Promise<{ id: string }>;
};

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: BookingCancelRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  // Chỉ chủ đơn đăng nhập mới có quyền hủy booking.
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để hủy đơn.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  // BƯỚC 2: Rate limit theo user + IP để giảm spam thao tác hủy đơn.
  const ip = getClientIp(request);
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
    // BƯỚC 3: Chỉ truy vấn booking thuộc đúng chủ đơn hiện tại.
    // Tìm booking theo id + userId để tránh hủy nhầm đơn người khác.
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
        departureDate: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Không tìm thấy đơn đặt tour." },
        { status: 404 },
      );
    }

    const decision = evaluateCancelBooking(booking.status, booking.paymentStatus, booking.departureDate);
    if (!decision.allowed) {
      // BƯỚC 3.1: Áp quy tắc nghiệp vụ hủy đơn (không phải trạng thái nào cũng cho hủy).
      // Rule nghiệp vụ: một số trạng thái không cho hủy online.
      if (decision.reason === "TOO_CLOSE_TO_DEPARTURE") {
        return NextResponse.json(
          { message: "Chỉ được hủy trước ngày khởi hành tối thiểu 2 ngày." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { message: "Đơn hiện tại không thể hủy trực tuyến." },
        { status: 400 },
      );
    }

    // BƯỚC 4: Cập nhật trạng thái sang CANCELLED và trả dữ liệu xác nhận.
    // Cập nhật trạng thái booking về CANCELLED.
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
      // Dự phòng demo mode khi DB tạm không khả dụng.
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

      if (result === "TOO_CLOSE_TO_DEPARTURE") {
        return NextResponse.json(
          { message: "Chỉ được hủy trước ngày khởi hành tối thiểu 2 ngày." },
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








