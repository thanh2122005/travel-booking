import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`auth:register:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 8,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        message: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const json = await parseJsonBody(request, "Dữ liệu đăng ký không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }
    const body = json.data;
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
