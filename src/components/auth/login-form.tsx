"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeRelativeCallbackUrl } from "@/lib/auth/callback-url";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeRelativeCallbackUrl(searchParams.get("callbackUrl"));
  const registerHref = callbackUrl
    ? `/dang-ky?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/dang-ky";

  // Quản lý Form bằng react-hook-form kết hợp Zod:
  // Giúp kiểm tra email và mật khẩu (validate) trực tiếp trên giao diện mà không cần reload trang.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Xử lý Sự kiện Đăng nhập (Submit):
  const onSubmit = handleSubmit(async (values) => {
    // 1. Gọi hàm signIn() của thư viện NextAuth.
    // Thư viện sẽ tự động gửi request đến `api/auth/[...nextauth]` để so khớp mật khẩu trong CSDL.
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      callbackUrl: callbackUrl ?? "/",
      redirect: false, // Ngăn NextAuth tự động chuyển trang để ta tự xử lý kết quả bằng toast.
    });

    if (!result || result.error) {
      toast.error("Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu.");
      return;
    }

    toast.success("Đăng nhập thành công.");
    // 2. Lấy lại session mới nhất từ server sau khi đăng nhập thành công.
    const session = await getSession();
    
    // 3. Phân luồng điều hướng (Routing):
    // - Nếu là ADMIN -> Vào thẳng trang Dashboard.
    // - Nếu là USER -> Vào trang tài khoản cá nhân hoặc quay lại trang cũ (callbackUrl).
    const destination = callbackUrl ?? (session?.user?.role === "ADMIN" ? "/admin" : "/tai-khoan");

    router.replace(destination);
    router.refresh();
  });

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>Nhập thông tin tài khoản để truy cập hệ thống.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email / Tên đăng nhập</Label>
            <Input
              id="email"
              type="text"
              placeholder="Nhập email hoặc tên đăng nhập (VD: admin)"
              {...register("email")}
            />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
            <p className="text-right text-sm">
              <Link href="/quen-mat-khau" className="font-medium text-primary hover:underline">
                Quên mật khẩu?
              </Link>
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href={registerHref} className="font-medium text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

