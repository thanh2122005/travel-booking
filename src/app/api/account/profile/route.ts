import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";
import { demoUpdateUserContent } from "@/lib/demo/admin-demo-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { profileUpdateSchema } from "@/lib/validations/profile";

export async function PATCH(request: Request) {
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để cập nhật hồ sơ.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Thông tin cập nhật không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({
      message: "Đã cập nhật hồ sơ cá nhân.",
      user: updated,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const updated = await demoUpdateUserContent(session.user.id, {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
      });

      if (!updated || updated === "LAST_ADMIN") {
        return NextResponse.json(
          { message: "Không thể cập nhật hồ sơ lúc này." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "Đã cập nhật hồ sơ cá nhân.",
        user: {
          id: updated.id,
          fullName: updated.fullName,
          email: updated.email,
          phone: updated.phone,
        },
      });
    }

    return NextResponse.json(
      { message: "Không thể cập nhật hồ sơ lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
