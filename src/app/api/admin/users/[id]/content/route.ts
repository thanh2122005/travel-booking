import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
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

export async function PATCH(request: Request, context: UserContentRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

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

  try {
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
      return NextResponse.json({ message: "Không thể cập nhật người dùng." }, { status: 500 });
    }
    return NextResponse.json({
      message: "Đã cập nhật thông tin người dùng.",
      user: updated,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Email đã tồn tại. Vui lòng chọn email khác." },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: "Không thể cập nhật người dùng." }, { status: 500 });
  }
}
