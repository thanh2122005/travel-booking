import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileQuickActionItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  active?: boolean;
};

type MobileQuickActionsProps = {
  items: MobileQuickActionItem[];
  hiddenOn?: "md" | "lg";
  className?: string;
};

export function MobileQuickActions({ items, hiddenOn = "lg", className }: MobileQuickActionsProps) {
  const hiddenClass = hiddenOn === "md" ? "md:hidden" : "lg:hidden";

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur",
        hiddenClass,
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const itemClassName = cn(
          "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition",
          item.active
            ? "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        );

        const content = (
          <>
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {item.label}
          </>
        );

        if (item.href.startsWith("#")) {
          return (
            <a key={item.href} href={item.href} className={itemClassName}>
              {content}
            </a>
          );
        }

        return (
          <Link key={item.href} href={item.href} className={itemClassName}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
