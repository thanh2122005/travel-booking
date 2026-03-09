import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];

      return NextResponse.json(
        {
          message: firstIssue?.message ?? "Dữ liệu không hợp lệ",
        },
        { status: 400 },
      );
    }

    const existingUser = await db.user.findUnique({
      where: {
        email: parsed.data.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Email đã tồn tại, vui lòng sử dụng email khác.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await db.user.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        passwordHash,
        phone: parsed.data.phone || null,
        role: UserRole.USER,
      },
    });

    return NextResponse.json(
      {
        message: "Đăng ký tài khoản thành công.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        message: "Không thể đăng ký lúc này, vui lòng thử lại sau.",
      },
      { status: 500 },
    );
  }
}
