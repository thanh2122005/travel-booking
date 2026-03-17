import type { ReactNode } from "react";
import { CalendarRange } from "lucide-react";

type DashboardHeaderProps = {
  periodLabel: string;
  actions: ReactNode;
  quickStats: Array<{
    label: string;
    value: string;
  }>;
};

export function DashboardHeader({ periodLabel, actions, quickStats }: DashboardHeaderProps) {
  return (
    <section className="iv-card rounded-2xl border-slate-200/80 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">Tổng quan vận hành</h1>
          <p className="mt-1 text-sm text-slate-600">Theo dõi nhanh doanh thu, đơn đặt và tín hiệu mới trong hệ thống.</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <CalendarRange className="h-3.5 w-3.5" />
            {periodLabel}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{actions}</div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {quickStats.map((item) => (
          <article key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-700">{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}



