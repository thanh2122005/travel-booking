import type { PaymentStatus } from "@prisma/client";

type PaymentStatusCardProps = {
  counts: Record<PaymentStatus, number>;
  labels: Record<PaymentStatus, string>;
};

const toneByStatus: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-500",
  UNPAID: "bg-amber-500",
};

export function PaymentStatusCard({ counts, labels }: PaymentStatusCardProps) {
  const entries = Object.entries(counts) as Array<[PaymentStatus, number]>;
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <article className="iv-card rounded-2xl border-slate-200 p-5">
      <h3 className="text-base font-bold text-slate-800">Trạng thái thanh toán</h3>
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
                <div className={`h-full rounded-full ${toneByStatus[status]}`} style={{ width: `${ratio}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
