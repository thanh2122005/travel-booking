// API SUMMARY: src/app/api/auth/register/route.ts
// Phạm vi: API xác thực (auth).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

// FLOW: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // STEP 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // STEP 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // STEP 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // STEP 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Giới hạn tần suất đăng ký theo IP để giảm spam.
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
    // Parse JSON và kiểm tra hợp lệ schema trước khi truy vấn DB.
    const json = await parseJsonBody(request, "Dữ liệu đăng ký không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }
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

    const existingUser = await db.user.findUnique({
      where: {
        email: parsed.data.email,
      },
    });

    if (existingUser) {
      // Tránh tạo trùng tài khoản theo email.
      return NextResponse.json(
        {
          message: "Email đã tồn tại, vui lòng sử dụng email khác.",
        },
        { status: 409 },
      );
    }

    // Luôn hash mật khẩu trước khi lưu.
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







