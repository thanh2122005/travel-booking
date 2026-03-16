import type { ReactNode } from "react";
import { Activity, CalendarRange } from "lucide-react";

type DashboardHeaderProps = {
  periodLabel: string;
  description: string;
  cards: Array<{
    label: string;
    value: string;
  }>;
  actions: ReactNode;
};

export function DashboardHeader({ periodLabel, description, cards, actions }: DashboardHeaderProps) {
  return (
    <section className="iv-card overflow-hidden border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/35 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">
            <Activity className="h-3.5 w-3.5" />
            Tổng quan vận hành
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-800">Bảng điều khiển quản trị</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <CalendarRange className="h-3.5 w-3.5" />
            Dữ liệu hiển thị: {periodLabel}
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:min-w-[280px]">{actions}</div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-800">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

