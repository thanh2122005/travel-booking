import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { updateAdminUsersBulk } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const userBulkUpdateSchema = z
  .object({
    ids: z.array(z.string().min(1)).min(1).max(300),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  })
  .refine((value) => value.role || value.status, {
    message: "Vui lòng chọn ít nhất một trường cập nhật.",
  });

export async function PATCH(request: Request) {
  const auth = await requireAdminApiAuth();
  if (auth.response) return auth.response;

  const json = await parseJsonBody(request, "Dữ liệu cập nhật hàng loạt người dùng không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = userBulkUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message || "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  if (
    parsed.data.ids.includes(auth.userId ?? "") &&
    ((parsed.data.role && parsed.data.role !== UserRole.ADMIN) || parsed.data.status === UserStatus.BLOCKED)
  ) {
    return NextResponse.json(
      { message: "Không thể tự hạ quyền hoặc tự khóa tài khoản quản trị trong cập nhật hàng loạt." },
      { status: 400 },
    );
  }

  const result = await updateAdminUsersBulk(parsed.data).catch(() => null);

  if (result === "LAST_ADMIN") {
    return NextResponse.json(
      { message: "Không thể hạ quyền hoặc khóa quản trị viên cuối cùng của hệ thống." },
      { status: 400 },
    );
  }

  if (!result) {
    return NextResponse.json({ message: "Không thể cập nhật người dùng hàng loạt." }, { status: 500 });
  }

  return NextResponse.json({
    message: `Đã cập nhật ${result.count} người dùng.`,
    count: result.count,
  });
}
