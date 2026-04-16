import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
};

export default function ResetPasswordPage() {
  // Trang bọc form nhập OTP + mật khẩu mới.
  return <ResetPasswordForm />;
}
