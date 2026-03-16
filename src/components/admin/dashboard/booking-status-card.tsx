import type { BookingStatus } from "@prisma/client";

type BookingStatusCardProps = {
  counts: Record<BookingStatus, number>;
  labels: Record<BookingStatus, string>;
};

export function BookingStatusCard({ counts, labels }: BookingStatusCardProps) {
  const entries = Object.entries(counts) as Array<[BookingStatus, number]>;
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <article className="iv-card rounded-2xl border-slate-200 p-5">
      <h3 className="text-base font-bold text-slate-800">Trạng thái đơn đặt tour</h3>
      <div className="mt-4 space-y-3">
        {entries.map(([status, count]) => {
          const ratio = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={status} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                <span>{labels[status]}</span>
                <span className="font-semibold text-slate-800">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${ratio}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
