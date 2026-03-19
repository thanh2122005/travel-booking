import { TrendingDown, TrendingUp } from "lucide-react";
import { deltaToneClass } from "@/components/admin/dashboard/formatters";
import type { DashboardKpiItem } from "@/components/admin/dashboard/types";

type StatsCardsProps = {
  items: DashboardKpiItem[];
};

export function StatsCards({ items }: StatsCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isLongValue = item.value.length >= 9;
        const isVeryLongValue = item.value.length >= 14;

        return (
          <article
            key={item.key}
            className="iv-card overflow-hidden rounded-2xl border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon className="h-4 w-4" />
              </span>
            </div>

            <p
              className={`mt-2 block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold leading-[1.1] tracking-[-0.01em] text-slate-700 ${
                isVeryLongValue
                  ? "text-[1.35rem] md:text-[1.55rem]"
                  : isLongValue
                    ? "text-[1.55rem] md:text-[1.75rem]"
                    : "text-[1.8rem] md:text-[2rem]"
              }`}
              title={item.value}
            >
              {item.value}
            </p>

            {item.deltaText ? (
              <p className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${deltaToneClass(item.deltaTone ?? "flat")}`}>
                {item.deltaTone === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : null}
                {item.deltaTone === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                {item.deltaText}
              </p>
            ) : item.hint ? (
              <p className="mt-2 text-xs text-slate-500">{item.hint}</p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
