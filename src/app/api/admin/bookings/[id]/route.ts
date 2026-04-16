// API SUMMARY: src/app/api/admin/bookings/[id]/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { BookingStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { updateAdminBooking } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const bookingUpdateSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

// Endpoint này dùng cho "cập nhật nhanh" trên admin table.
// Nếu cần sửa thông tin booking chi tiết (khách, số khách, ngày đi...) thì dùng endpoint detail.
type BookingRouteContext = {
  params: Promise<{ id: string }>;
};

// FLOW: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: BookingRouteContext) {
  // STEP 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // STEP 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // STEP 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // STEP 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  // Guard admin từ sớm để ngăn request trái quyền.
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;

  // Phân tích body thống nhất format lỗi nếu client gửi sai JSON.
  const json = await parseJsonBody(request, "Dữ liệu cập nhật booking không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = bookingUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    // Trả lỗi kiểm tra hợp lệ đầu tiên để UX gọn gàng.
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật không hợp lệ." },
      { status: 400 },
    );
  }

  // Lưu ý cho dev:
  // Endpoint này cho update status và paymentStatus, không sửa thông tin khách/tour.
  // Trường hợp cần sửa chi tiết đơn thì dùng endpoint detail/content khác.
  try {
    const updated = await updateAdminBooking(id, parsed.data);
    return NextResponse.json({ message: "Đã cập nhật đơn đặt tour.", booking: updated });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy đơn đặt tour cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật đơn đặt tour." }, { status: 500 });
  }
}

