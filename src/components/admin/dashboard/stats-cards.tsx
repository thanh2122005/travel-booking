import { TrendingDown, TrendingUp } from "lucide-react";
import { deltaToneClass } from "@/components/admin/dashboard/formatters";
import type { DashboardKpiItem } from "@/components/admin/dashboard/types";

type StatsCardsProps = {
  items: DashboardKpiItem[];
};

export function StatsCards({ items }: StatsCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.key}
            className="iv-card rounded-2xl border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="h-4 w-4" />
              </span>
            </div>

            <p className="mt-2 text-3xl font-semibold leading-none text-slate-700">{item.value}</p>

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
