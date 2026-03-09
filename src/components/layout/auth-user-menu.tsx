"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthUserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dang-nhap" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Đăng nhập
        </Link>
        <Link href="/dang-ky" className={buttonVariants({ size: "sm" })}>
          Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={session.user.role === "ADMIN" ? "/admin" : "/tai-khoan"}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-3")}
      >
        {session.user.role === "ADMIN" ? "Quản trị" : "Tài khoản"}
      </Link>
      <Button size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Đăng xuất
      </Button>
    </div>
  );
}
