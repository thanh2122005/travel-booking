import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminUser } from "@/lib/db/admin-queries";

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
