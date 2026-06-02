// API Xử lý Đăng ký tài khoản: Validate form, mã hóa mật khẩu và tạo user mới trong CSDL.

import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  // Rate limit: Giới hạn tần suất đăng ký từ 1 địa chỉ IP (chống bot spam tạo hàng loạt tài khoản ảo).
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
    // Parse Body: Đọc dữ liệu JSON gửi lên từ client.
    const json = await parseJsonBody(request, "Dữ liệu đăng ký không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }
    // Validate dữ liệu: Kiểm tra tính hợp lệ của email, mật khẩu (độ dài, ký tự) bằng thư viện Zod.
    const parsed = registerSchema.safeParse(json.data);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];

      return NextResponse.json(
        {
          message: firstIssue?.message ?? "Dữ liệu không hợp lệ.",
        },
        { status: 400 },
      );
    }

    // Kiểm tra trùng lặp: Tìm xem email này đã có người khác đăng ký trong CSDL chưa.
    const existingUser = await db.user.findUnique({
      where: {
        email: parsed.data.email,
      },
    });

    // Tránh tạo trùng tài khoản theo email.
    if (existingUser) {
      return NextResponse.json(
        {
          message: "Email đã tồn tại, vui lòng sử dụng email khác.",
        },
        { status: 409 },
      );
    }

    // Hash mật khẩu: Băm mật khẩu người dùng nhập (chuỗi thô) bằng thuật toán bcrypt (mức salt 10) trước khi lưu để bảo mật.
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    // Tạo tài khoản mới: Lưu thông tin vào CSDL. Mặc định mọi tài khoản mới đăng ký đều có quyền USER.
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
