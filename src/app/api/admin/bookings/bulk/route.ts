// TÓM TẮT API: src/app/api/admin/bookings/bulk/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { BookingStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { isBookingPaymentMetadataMigrationError } from "@/lib/db/booking-payment-metadata";
import { isPrismaForeignKeyError } from "@/lib/db/db-error";
import { updateAdminBookingsBulk } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const bulkBookingSchema = z
  .object({
    ids: z.array(z.string().min(1)).min(1).max(200),
    status: z.nativeEnum(BookingStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  })
  .refine((value) => value.status || value.paymentStatus, {
    message: "Vui lòng chọn ít nhất một trường cập nhật.",
    path: ["status"],
  });

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  const guard = await requireAdminApiAuth();
  if (guard.response) return guard.response;

  try {
    const json = await parseJsonBody(request, "Dữ liệu cập nhật đơn đặt tour hàng loạt không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }

    const parsed = bulkBookingSchema.safeParse(json.data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Dữ liệu cập nhật hàng loạt không hợp lệ." },
        { status: 400 },
      );
    }

    const updated = await updateAdminBookingsBulk(parsed.data, guard.userId);
    if (updated.count === 0) {
      return NextResponse.json({ message: "Không tìm thấy đơn đặt tour phù hợp để cập nhật." }, { status: 404 });
    }

    return NextResponse.json({
      message: `Đã cập nhật ${updated.count} đơn đặt tour.`,
      count: updated.count,
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
        { message: "Không thể xác nhận thanh toán hàng loạt do dữ liệu tài khoản quản trị không hợp lệ. Vui lòng đăng nhập lại." },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}


