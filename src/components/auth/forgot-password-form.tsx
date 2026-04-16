"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Gọi API tạo OTP theo email người dùng nhập.
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        debugOtp?: string;
      };

      if (!response.ok) {
        toast.error(data.message ?? "Không thể tạo mã OTP.");
        return;
      }

      toast.success(data.message ?? "Đã gửi OTP.");
      const email = values.email.trim().toLowerCase();

      if (data.debugOtp) {
        // Lưu tạm OTP demo để prefill trang reset password.
        sessionStorage.setItem(
          "password_reset_prefill",
          JSON.stringify({
            email,
            otp: data.debugOtp,
          }),
        );
        toast.message(`OTP tạm: ${data.debugOtp}`);
        router.push(
          `/dat-lai-mat-khau?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(data.debugOtp)}`,
        );
        return;
      }

      router.push(`/dat-lai-mat-khau?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
    }
  });

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
        <CardDescription>
          Nhập email đã đăng ký. Hệ thống sẽ cấp mã OTP để bạn đặt lại mật khẩu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email đã đăng ký</Label>
            <Input id="email" type="email" placeholder="ban@example.com" {...register("email")} />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi OTP...
              </>
            ) : (
              "Gửi mã OTP"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Đã có OTP?{" "}
          <Link href="/dat-lai-mat-khau" className="font-medium text-primary hover:underline">
            Đặt lại mật khẩu
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
