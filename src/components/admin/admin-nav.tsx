"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookMarked,
  Mail,
  MapPinned,
  MessageCircleMore,
  MessageSquareQuote,
  TicketCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Tổng quan", icon: BarChart3 },
  { href: "/admin/tours", label: "Tour", icon: BookMarked },
  { href: "/admin/locations", label: "Điểm đến", icon: MapPinned },
  { href: "/admin/bookings", label: "Đơn đặt", icon: TicketCheck },
  { href: "/admin/reviews", label: "Đánh giá", icon: MessageCircleMore },
  { href: "/admin/inquiries", label: "Tư vấn", icon: MessageSquareQuote },
  { href: "/admin/newsletter", label: "Nhận tin", icon: Mail },
  { href: "/admin/users", label: "Thành viên", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 overflow-x-auto pb-1 lg:grid lg:gap-1.5 lg:overflow-visible lg:pb-0">
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
              "group inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 lg:border-transparent lg:bg-transparent",
              isActive &&
                "border-teal-200 bg-teal-50 text-teal-700 shadow-sm lg:border-slate-200 lg:bg-white",
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-600",
                isActive && "text-teal-600",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}