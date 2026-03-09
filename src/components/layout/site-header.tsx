import Link from "next/link";
import { Menu, PlaneTakeoff } from "lucide-react";
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

        <nav className="hidden items-center gap-5 lg:flex">
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
          <div className="hidden sm:block">
            <AuthUserMenu />
          </div>
          <details className="relative lg:hidden">
            <summary className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border bg-background">
              <Menu className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card p-3 shadow-lg">
              <nav className="grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-2 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-2 border-t pt-2 sm:hidden">
                <AuthUserMenu />
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
