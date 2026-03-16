import { TrendingDown, TrendingUp } from "lucide-react";
import { deltaToneClass } from "@/components/admin/dashboard/formatters";
import type { DashboardKpiItem } from "@/components/admin/dashboard/types";

type StatsCardsProps = {
  items: DashboardKpiItem[];
};

export function StatsCards({ items }: StatsCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.key}
            className="iv-card rounded-2xl border-slate-200 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-800">{item.value}</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon className="h-5 w-5" />
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
            {item.deltaText ? (
              <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${deltaToneClass(item.deltaTone ?? "flat")}`}>
                {item.deltaTone === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : null}
                {item.deltaTone === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                {item.deltaText}
              </p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
