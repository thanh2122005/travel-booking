"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { buildCallbackUrl } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";

const ADMIN_LABEL = "Quản trị";

function getDisplayName(name?: string | null) {
  if (!name) return "Tài khoản";
  return name.split(" ").filter(Boolean).slice(-2).join(" ");
}

export function AuthUserMenu() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = buildCallbackUrl(
    pathname || "/",
    searchParams.toString() ? `?${searchParams.toString()}` : "",
  );
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={{ pathname: "/dang-nhap", query: { callbackUrl } }}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Đăng nhập
        </Link>
        <Link
          href={{ pathname: "/dang-ky", query: { callbackUrl } }}
          className={buttonVariants({ size: "sm" })}
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const profileHref = session.user.role === "ADMIN" ? "/admin" : "/tai-khoan";
  const label = session.user.role === "ADMIN" ? ADMIN_LABEL : getDisplayName(session.user.name);

  return (
    <div className="flex items-center gap-2">
      <Link
        href={profileHref}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-3")}
        title={session.user.email || undefined}
      >
        {label}
      </Link>
      <Button size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Đăng xuất
      </Button>
    </div>
  );
}
