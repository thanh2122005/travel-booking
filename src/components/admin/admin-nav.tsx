"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookMarked, MapPinned, MessageCircleMore, TicketCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Tổng quan", icon: BarChart3 },
  { href: "/admin/tours", label: "Tour", icon: BookMarked },
  { href: "/admin/locations", label: "Điểm đến", icon: MapPinned },
  { href: "/admin/bookings", label: "Đơn đặt tour", icon: TicketCheck },
  { href: "/admin/reviews", label: "Đánh giá", icon: MessageCircleMore },
  { href: "/admin/users", label: "Người dùng", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {adminNavItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
              isActive && "bg-slate-100 text-slate-900",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
