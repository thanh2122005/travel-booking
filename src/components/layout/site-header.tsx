import Link from "next/link";
import { PlaneTakeoff } from "lucide-react";
import { AuthUserMenu } from "@/components/layout/auth-user-menu";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/tours", label: "Tour du lịch" },
  { href: "/dia-diem", label: "Địa điểm" },
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/lien-he", label: "Liên hệ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-bold text-primary">
          <PlaneTakeoff className="h-5 w-5" />
          Travel Booking
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
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

        <AuthUserMenu />
      </div>
    </header>
  );
}
