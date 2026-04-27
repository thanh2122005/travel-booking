// TÓM TẮT API: src/app/api/auth/reset-password/route.ts
// Phạm vi: API xác thực (auth).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { resetPasswordWithOtp } from "@/lib/auth/password-reset";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";

// LUỒNG: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // BƯỚC 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // BƯỚC 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // BƯỚC 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Rate limit endpoint reset password theo IP.
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`auth:reset-password:${ip}`, {
    windowMs: 10 * 60 * 1000,
    max: 15,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  // BƯỚC 2: Phân tích body + kiểm tra hợp lệ schema trước khi xử lý OTP.
  const json = await parseJsonBody(request, "Dữ liệu đặt lại mật khẩu không hợp lệ.");
  if (!json.ok) return json.response;

  const parsed = resetPasswordSchema.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // BƯỚC 3: Xác thực OTP và cập nhật password hash mới.
    // Verify OTP rồi cập nhật password hash mới cho user.
    const result = await resetPasswordWithOtp({
      email: parsed.data.email,
      otp: parsed.data.otp,
      newPassword: parsed.data.newPassword,
    });

    if (!result.ok) {
      // BƯỚC 3.1: Tách từng reason để frontend hiển thị thông điệp chính xác.
      // Cách này giúp demo bảo mật rõ: sai OTP, hết hạn OTP, khóa OTP... là các trạng thái riêng.
      // Tách từng reason để frontend hiển thị thông điệp chính xác.
      if (result.reason === "NOT_FOUND") {
        return NextResponse.json(
          { message: "Email chưa được đăng ký tài khoản." },
          { status: 404 },
        );
      }
      if (result.reason === "OTP_NOT_FOUND") {
        return NextResponse.json(
          { message: "Bạn chưa yêu cầu mã OTP hoặc mã đã hết hiệu lực." },
          { status: 400 },
        );
      }
      if (result.reason === "OTP_EXPIRED") {
        return NextResponse.json(
          { message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." },
          { status: 400 },
        );
      }
      if (result.reason === "OTP_LOCKED") {
        return NextResponse.json(
          { message: "Bạn nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { message: "Mã OTP không chính xác." },
        { status: 400 },
      );
    }

    // BƯỚC 4: Trả response thành công, yêu cầu user đăng nhập lại bằng mật khẩu mới.
    return NextResponse.json(
      { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." },
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

    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}








