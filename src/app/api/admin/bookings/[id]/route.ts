// API Cập Nhật Nhanh Đơn Đặt Tour (Admin Only).
// Chức năng: Cho phép quản trị viên thay đổi trạng thái Booking (Đã xác nhận, Đã hủy) hoặc trạng thái Thanh toán (Đã thanh toán).
// Endpoint này chỉ cập nhật các trạng thái (Enum), không thay đổi số khách hay ngày đi để tránh sai lệch doanh thu.
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { isBookingPaymentMetadataMigrationError } from "@/lib/db/booking-payment-metadata";
import { isPrismaForeignKeyError } from "@/lib/db/db-error";
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

export async function PATCH(request: Request, context: BookingRouteContext) {
  // Xác thực quyền (Auth Guard): Chỉ có tài khoản Quản trị (Admin) mới có quyền cập nhật hóa đơn.
  // Hàm này trả về userId (để ghi log ai duyệt đơn) nếu hợp lệ.
  const guard = await requireAdminApiAuth();
  if (guard.response) return guard.response;

  const { id } = await context.params;

  // Phân tích body thống nhất format lỗi nếu client gửi sai JSON.
  const json = await parseJsonBody(request, "Dữ liệu cập nhật booking không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = bookingUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    // Trả lỗi Validation: Báo cho frontend biết dữ liệu trạng thái truyền lên không đúng chuẩn Enum.
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // Cập nhật CSDL và Ghi Log (Audit Trail):
    // Hàm `updateAdminBooking` không chỉ cập nhật trạng thái đơn mà còn lưu lại userId của nhân viên thao tác.
    // Việc này phục vụ truy vết (log) xem "Ai là người đã duyệt đơn/hủy đơn này?".
    const updated = await updateAdminBooking(id, parsed.data, guard.userId);
    if (!updated) {
      return NextResponse.json({ message: "Không tìm thấy đơn đặt tour cần cập nhật." }, { status: 404 });
    }
    return NextResponse.json({ message: "Đã cập nhật đơn đặt tour.", booking: updated });
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
    return NextResponse.json({ message: "Không thể cập nhật đơn đặt tour." }, { status: 500 });
  }
}


