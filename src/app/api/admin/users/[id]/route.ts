import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { deleteAdminUser, getAdminUsers, updateAdminUser } from "@/lib/db/admin-queries";

const userUpdateSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

type UserRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: UserRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  const updated = await updateAdminUser(id, parsed.data).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật người dùng." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã cập nhật người dùng.", user: updated });
}

export async function DELETE(_request: Request, context: UserRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const removed = await deleteAdminUser(id).catch(() => null);

  if (removed === "LAST_ADMIN") {
    return NextResponse.json(
      { message: "Không thể xóa quản trị viên cuối cùng của hệ thống." },
      { status: 400 },
    );
  }

  if (!removed) {
    return NextResponse.json({ message: "Không thể xóa người dùng." }, { status: 500 });
  }

  const currentUsers = await getAdminUsers({ page: 1, pageSize: 1 }).catch(() => null);

  return NextResponse.json({
    message: "Đã xóa người dùng thành công.",
    user: removed,
    totalUsers: currentUsers?.total,
  });
}
