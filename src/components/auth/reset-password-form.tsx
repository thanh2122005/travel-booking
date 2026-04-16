"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

type ResetPrefillStorage = {
  email?: string;
  otp?: string;
};

function readStoragePrefill(): ResetPrefillStorage {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("password_reset_prefill");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ResetPrefillStorage;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const presetOtp = searchParams.get("otp")?.trim() ?? "";
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const {
    register,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: presetEmail,
      otp: presetOtp,
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    // Lấy prefill từ query/storage để giảm thao tác nhập lại cho user.
    const storage = readStoragePrefill();
    const effectiveEmail = presetEmail || storage.email?.trim().toLowerCase() || "";
    const effectiveOtp = presetOtp || storage.otp?.trim() || "";

    if (effectiveEmail) {
      setValue("email", effectiveEmail, { shouldValidate: false });
    }
    if (effectiveOtp) {
      setValue("otp", effectiveOtp, { shouldValidate: true });
    }
  }, [presetEmail, presetOtp, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Không thể đặt lại mật khẩu.");
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("password_reset_prefill");
      }
      toast.success(data.message ?? "Đặt lại mật khẩu thành công.");
      router.push("/dang-nhap");
    } catch {
      toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
    }
  });

  async function handleResendOtp() {
    const email = (presetEmail || getValues("email")).trim().toLowerCase();
    if (!email) {
      toast.error("Vui lòng nhập email trước khi gửi lại OTP.");
      return;
    }

    setIsResendingOtp(true);
    try {
      // Gửi lại OTP bằng cùng endpoint quên mật khẩu.
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        debugOtp?: string;
      };

      if (!response.ok) {
        toast.error(data.message ?? "Không thể gửi lại OTP.");
        return;
      }

      toast.success(data.message ?? "Đã gửi lại mã OTP. Vui lòng kiểm tra email của bạn.");
      if (data.debugOtp) {
        setValue("otp", data.debugOtp, { shouldValidate: true });
        sessionStorage.setItem(
          "password_reset_prefill",
          JSON.stringify({
            email,
            otp: data.debugOtp,
          }),
        );
        toast.message(`OTP tạm mới: ${data.debugOtp}`);
      }
    } catch {
      toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
    } finally {
      setIsResendingOtp(false);
    }
  }

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
        <CardDescription>Nhập email, mã OTP và mật khẩu mới.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email đã đăng ký</Label>
            <Input
              id="email"
              type="email"
              placeholder="ban@example.com"
              readOnly={Boolean(presetEmail)}
              {...register("email")}
            />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Mã OTP</Label>
            <Input id="otp" type="text" placeholder="6 chữ số" maxLength={6} {...register("otp")} />
            {errors.otp ? <p className="text-sm text-destructive">{errors.otp.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input id="newPassword" type="password" placeholder="Tối thiểu 8 ký tự" {...register("newPassword")} />
            {errors.newPassword ? <p className="text-sm text-destructive">{errors.newPassword.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              {...register("confirmNewPassword")}
            />
            {errors.confirmNewPassword ? (
              <p className="text-sm text-destructive">{errors.confirmNewPassword.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              "Đặt lại mật khẩu"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Chưa có OTP?{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResendingOtp}
            className="font-medium text-primary hover:underline disabled:opacity-60"
          >
            Gửi lại OTP
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
