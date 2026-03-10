"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, X } from "lucide-react";
import { AuthUserMenu } from "@/components/layout/auth-user-menu";
import { publicNavItems } from "@/lib/content/site-navigation";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navClassName = useMemo(
    () => cn("iv-nav", isScrolled && "iv-nav-scrolled"),
    [isScrolled],
  );

  return (
    <header className={navClassName}>
      <div className="mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="iv-brand inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
            <Compass className="h-4.5 w-4.5 text-teal-600" />
          </span>
          Immersive<span>Vietnam</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("iv-nav-link text-sm font-semibold", isActivePath(pathname, item.href) && "iv-link-active")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <AuthUserMenu />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-teal-500 hover:text-teal-700 lg:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? "Đóng menu" : "Mở menu"}
          >
            {isOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-slate-200/80 bg-white px-4 pb-4 pt-3 shadow-sm lg:hidden">
          <nav className="grid gap-1.5">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
                  isActivePath(pathname, item.href) && "bg-slate-100 text-slate-900",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 border-t pt-2 sm:hidden">
            <AuthUserMenu />
          </div>
        </div>
      ) : null}
    </header>
  );
}
