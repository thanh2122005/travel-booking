// API SUMMARY: src/app/api/admin/bookings/[id]/detail/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { isBookingPaymentMetadataMigrationError } from "@/lib/db/booking-payment-metadata";
import { isPrismaForeignKeyError } from "@/lib/db/db-error";
import { updateAdminBookingDetail } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const bookingDetailUpdateSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên là bắt buộc."),
  email: z.string().trim().email("Email không hợp lệ."),
  phone: z.string().trim().min(8, "Số điện thoại không hợp lệ."),
  numberOfGuests: z.number().int().positive("Số khách phải lớn hơn 0."),
  note: z.string().trim().nullable().optional(),
  departureDate: z.string().trim().nullable().optional(),
  paymentMethod: z.string().trim().min(1, "Phương thức thanh toán là bắt buộc."),
  roomType: z.enum(["DOUBLE", "SINGLE"]).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

function isBookingAdminCompatibilityError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
    return true;
  }

  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Unknown column") ||
    (message.includes("The column") && message.includes("does not exist")) ||
    message.includes("Unknown field `roomType`") ||
    message.includes("Unknown field `baseGuestTotal`") ||
    message.includes("Unknown field `roomSurchargeTotal`") ||
    message.includes("Unknown field `guestsFrom8`") ||
    message.includes("Unknown field `child5To7Guests`") ||
    message.includes("Unknown field `childUnder5Guests`") ||
    message.includes("Unknown field `singleRoomSurchargePerAdult`") ||
    message.includes("Unknown argument `roomType`") ||
    message.includes("Unknown argument `baseGuestTotal`") ||
    message.includes("Unknown argument `roomSurchargeTotal`") ||
    message.includes("Unknown argument `guestsFrom8`") ||
    message.includes("Unknown argument `child5To7Guests`") ||
    message.includes("Unknown argument `childUnder5Guests`") ||
    message.includes("Unknown argument `singleRoomSurchargePerAdult`")
  );
}

type BookingDetailRouteContext = {
  params: Promise<{ id: string }>;
};

// FLOW: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: BookingDetailRouteContext) {
  // STEP 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // STEP 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // STEP 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // STEP 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  const guard = await requireAdminApiAuth();
  if (guard.response) return guard.response;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật chi tiết đơn không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = bookingDetailUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật đơn không hợp lệ." },
      { status: 400 },
    );
  }

  const departureDate =
    parsed.data.departureDate && parsed.data.departureDate.length
      ? new Date(parsed.data.departureDate)
      : null;
  if (departureDate && Number.isNaN(departureDate.getTime())) {
    return NextResponse.json({ message: "Ngày khởi hành không hợp lệ." }, { status: 400 });
  }

  try {
    const updated = await updateAdminBookingDetail(id, {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      numberOfGuests: parsed.data.numberOfGuests,
      note: parsed.data.note ?? null,
      departureDate: departureDate ? departureDate.toISOString() : null,
      paymentMethod: parsed.data.paymentMethod,
      roomType: parsed.data.roomType,
      status: parsed.data.status,
      paymentStatus: parsed.data.paymentStatus,
    }, guard.userId);

    if (updated === "NOT_FOUND") {
      return NextResponse.json({ message: "Không tìm thấy đơn đặt tour cần cập nhật." }, { status: 404 });
    }
    if (updated === "MAX_GUESTS_EXCEEDED") {
      return NextResponse.json(
        { message: "Không thể cập nhật đơn. Vui lòng kiểm tra số khách tối đa của tour." },
        { status: 409 },
      );
    }
    if (updated === "INVALID_ROOM_TYPE") {
      return NextResponse.json(
        { message: "Tour không áp dụng loại phòng đơn." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Đã cập nhật chi tiết đơn đặt tour.",
      booking: updated,
    });
  } catch (error) {
    if (isBookingPaymentMetadataMigrationError(error)) {
      return NextResponse.json(
        { message: "CSDL chưa cập nhật chức năng xác nhận thanh toán/vé điện tử." },
        { status: 503 },
      );
    }
    if (isPrismaForeignKeyError(error)) {
      return NextResponse.json(
        { message: "Không thể xác nhận thanh toán do dữ liệu tài khoản quản trị không hợp lệ. Vui lòng đăng nhập lại." },
        { status: 409 },
      );
    }
    if (isBookingAdminCompatibilityError(error)) {
      return NextResponse.json(
        { message: "CSDL chưa đồng bộ đầy đủ cấu trúc booking admin. Vui lòng chạy migration rồi thử lại." },
        { status: 503 },
      );
    }
    if (process.env.NODE_ENV !== "production") {
      const debugMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { message: `Không thể cập nhật chi tiết đơn đặt tour. Debug: ${debugMessage}` },
        { status: 500 },
      );
    }
    return NextResponse.json({ message: "Không thể cập nhật chi tiết đơn đặt tour." }, { status: 500 });
  }
}

