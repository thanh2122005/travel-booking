// API SUMMARY: src/app/api/auth/forgot-password/route.ts
// Phạm vi: API xác thực (auth).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { createPasswordResetOtp } from "@/lib/auth/password-reset";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";

// FLOW: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // STEP 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // STEP 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // STEP 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // STEP 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Rate limit endpoint quên mật khẩu theo IP.
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`auth:forgot-password:${ip}`, {
    windowMs: 10 * 60 * 1000,
    max: 10,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  // STEP 2: Parse JSON an toàn + kiểm tra hợp lệ dữ liệu đầu vào.
  const json = await parseJsonBody(request, "Dữ liệu quên mật khẩu không hợp lệ.");
  if (!json.ok) return json.response;

  const parsed = forgotPasswordSchema.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // STEP 3: Tạo OTP reset. Hàm service sẽ tự kiểm tra user có tồn tại hay không.
    // Tạo OTP reset password cho email đã đăng ký.
    const result = await createPasswordResetOtp(parsed.data.email);
    if (!result.ok) {
      return NextResponse.json(
        { message: "Email chưa được đăng ký tài khoản." },
        { status: 404 },
      );
    }

    // STEP 4: Trả response thành công.
    // Demo log: trong production thật phải gửi OTP qua email/SMS, không log ra console.
    console.info(
      `[PASSWORD_RESET_OTP_DEMO] email=${result.email} otp=${result.otp} expiresAt=${result.expiresAt.toISOString()}`,
    );

    return NextResponse.json(
      {
        message: "Đã tạo mã OTP tạm. Vui lòng nhập OTP để đặt lại mật khẩu.",
        debugOtp: result.otp,
      },
      { status: 200 },
    );
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const detail =
        process.env.NODE_ENV !== "production"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined;
      return NextResponse.json(
        {
          message: "Hệ thống cơ sở dữ liệu đang tạm gián đoạn. Vui lòng thử lại sau.",
          detail,
        },
        { status: 503 },
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Không thể tạo mã OTP lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}







