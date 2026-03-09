import Link from "next/link";
import { MapPinned, PlaneTakeoff } from "lucide-react";
import { AuthUserMenu } from "@/components/layout/auth-user-menu";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/dang-nhap", label: "Đăng nhập" },
  { href: "/dang-ky", label: "Đăng ký" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-bold text-primary">
          <PlaneTakeoff className="h-5 w-5" />
          Travel Booking System
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground lg:inline-flex">
            <MapPinned className="h-3.5 w-3.5" />
            Giai đoạn 1
          </span>
          <AuthUserMenu />
        </div>
      </div>
    </header>
  );
}
