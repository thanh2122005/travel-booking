import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
};

export default function ForgotPasswordPage() {
  // Trang bọc form yêu cầu OTP đặt lại mật khẩu.
  return <ForgotPasswordForm />;
}
