// TÓM TẮT API: src/app/api/admin/users/[id]/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { deleteAdminUser, getAdminUsers, updateAdminUser } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const userUpdateSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

// Ghi chú nhanh cho route này:
// - PATCH: chỉ cập nhật quyền/trạng thái (không sửa profile chi tiết).
// - DELETE: xóa user theo rule an toàn admin.
// - Mọi logic nặng (last admin, cascade delete...) để ở admin-queries.

type UserRouteContext = {
  params: Promise<{ id: string }>;
};

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: UserRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  // requireAdminApiAuth khác requireAdminApi:
  // - Ngoài response guard, hàm này còn trả userId hiện tại.
  // - UserId này cần cho rule chặn admin tự khóa / tự hạ quyền.
  const auth = await requireAdminApiAuth();
  if (auth.response) return auth.response;

  const { id } = await context.params;

  // Parse JSON theo helper chung để format lỗi 400 thống nhất.
  const json = await parseJsonBody(request, "Dữ liệu cập nhật người dùng không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = userUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    // Endpoint này chỉ cho cập nhật role/status.
    return NextResponse.json({ message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  if (
    id === auth.userId &&
    ((parsed.data.role && parsed.data.role !== UserRole.ADMIN) || parsed.data.status === UserStatus.BLOCKED)
  ) {
    // Quy tắc an toàn quản trị:
    // Không cho admin đang login tự biến mình thành USER hoặc BLOCKED.
    return NextResponse.json(
      { message: "Bạn không thể tự hạ quyền hoặc tự khóa tài khoản quản trị." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAdminUser(id, parsed.data);

    if (updated === "LAST_ADMIN") {
      // Bảo vệ cấp service: không cho hệ thống mất admin cuối cùng.
      return NextResponse.json(
        { message: "Không thể hạ quyền hoặc khóa quản trị viên cuối cùng của hệ thống." },
        { status: 400 },
      );
    }

    if (updated === "NOT_FOUND") {
      return NextResponse.json({ message: "Không tìm thấy người dùng cần cập nhật." }, { status: 404 });
    }
    if (!updated || typeof updated === "string") {
      return NextResponse.json({ message: "Không tìm thấy người dùng cần cập nhật." }, { status: 404 });
    }
    await appendAdminActivityLog({
      action: "USER_UPDATED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        userId: updated.id,
        role: updated.role,
        status: updated.status,
      },
    }).catch(() => undefined);

    return NextResponse.json({ message: "Đã cập nhật người dùng.", user: updated });
  } catch {
    return NextResponse.json({ message: "Không thể cập nhật người dùng." }, { status: 500 });
  }
}

// LUỒNG: DELETE - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function DELETE(_request: Request, context: UserRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập để tránh xóa trái phép.
  // BƯỚC 2: Phân tích input cần thiết (id/body/query) và kiểm tra hợp lệ.
  // BƯỚC 3: Kiểm tra tồn tại + ràng buộc nghiệp vụ trước khi xóa.
  // BƯỚC 4: Xóa dữ liệu và trả kết quả/thông báo lỗi phù hợp.
  const auth = await requireAdminApiAuth();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  if (id === auth.userId) {
    // Chặn tự xóa tài khoản đang sử dụng để tránh mất phiên quản trị hiện tại.
    return NextResponse.json(
      { message: "Bạn không thể tự xóa tài khoản quản trị đang đăng nhập." },
      { status: 400 },
    );
  }

  try {
    // Hàm service đã xử lý các ràng buộc quan trọng:
    // - Không xóa admin cuối cùng
    // - Xóa dữ liệu liên quan theo chính sách nghiệp vụ
    const removed = await deleteAdminUser(id);

    if (removed === "LAST_ADMIN") {
      return NextResponse.json(
        { message: "Không thể xóa quản trị viên cuối cùng của hệ thống." },
        { status: 400 },
      );
    }
    if (removed === "NOT_FOUND") {
      return NextResponse.json({ message: "Không tìm thấy người dùng cần xóa." }, { status: 404 });
    }
    if (!removed || typeof removed === "string") {
      return NextResponse.json({ message: "Không tìm thấy người dùng cần xóa." }, { status: 404 });
    }
    await appendAdminActivityLog({
      action: "USER_DELETED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        userId: removed.id,
        email: removed.email,
        fullName: removed.fullName,
      },
    }).catch(() => undefined);

    let totalUsers: number | undefined;

    try {
      // Trả thêm totalUsers để UI cập nhật nhanh (badge/tổng số) mà không cần query lần 2 từ frontend.
      const currentUsers = await getAdminUsers({ page: 1, pageSize: 1 });
      totalUsers = currentUsers.total;
    } catch {
      totalUsers = undefined;
    }

    return NextResponse.json({
      message: "Đã xóa người dùng thành công.",
      user: removed,
      totalUsers,
    });
  } catch {
    return NextResponse.json({ message: "Không thể xóa người dùng." }, { status: 500 });
  }
}








