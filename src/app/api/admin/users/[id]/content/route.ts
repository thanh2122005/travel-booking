// TÓM TẮT API: src/app/api/admin/users/[id]/content/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { updateAdminUserContent } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { optionalNullableMediaUrlSchema } from "@/lib/validations/media-url";

const userContentUpdateSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên là bắt buộc."),
  email: z.string().trim().email("Email không hợp lệ."),
  phone: z.string().trim().nullable().optional(),
  avatarUrl: optionalNullableMediaUrlSchema("URL ảnh đại diện không hợp lệ."),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
});

type UserContentRouteContext = {
  params: Promise<{ id: string }>;
};

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: UserContentRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  // Dùng auth chi tiết để có userId hiện tại (phục vụ rule tự khóa/tự hạ quyền).
  const auth = await requireAdminApiAuth();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật nội dung người dùng không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = userContentUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật người dùng không hợp lệ." },
      { status: 400 },
    );
  }

  if (id === auth.userId && (parsed.data.role !== UserRole.ADMIN || parsed.data.status === UserStatus.BLOCKED)) {
    // Không cho admin tự biến mình thành non-admin hoặc blocked.
    return NextResponse.json(
      { message: "Bạn không thể tự hạ quyền hoặc tự khóa tài khoản quản trị." },
      { status: 400 },
    );
  }

  try {
    // Update profile + role + status trong 1 endpoint.
    const updated = await updateAdminUserContent(id, {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      avatarUrl: parsed.data.avatarUrl ?? null,
      role: parsed.data.role,
      status: parsed.data.status,
    });

    if (updated === "LAST_ADMIN") {
      return NextResponse.json(
        { message: "Không thể hạ quyền hoặc khóa quản trị viên cuối cùng của hệ thống." },
        { status: 400 },
      );
    }

    if (!updated) {
      return NextResponse.json({ message: "Không tìm thấy người dùng cần cập nhật." }, { status: 404 });
    }
    await appendAdminActivityLog({
      action: "USER_CONTENT_UPDATED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        userId: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        status: updated.status,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      message: "Đã cập nhật thông tin người dùng.",
      user: updated,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Trùng email unique.
      return NextResponse.json(
        { message: "Email đã tồn tại. Vui lòng chọn email khác." },
        { status: 409 },
      );
    }

    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy người dùng cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật người dùng." }, { status: 500 });
  }
}









