import type { BookingStatus, PaymentStatus } from "@prisma/client";

type StatusSummaryProps = {
  bookingCounts: Record<BookingStatus, number>;
  paymentCounts: Record<PaymentStatus, number>;
  bookingLabels: Record<BookingStatus, string>;
  paymentLabels: Record<PaymentStatus, string>;
};

function ratio(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export function StatusSummary({
  bookingCounts,
  paymentCounts,
  bookingLabels,
  paymentLabels,
}: StatusSummaryProps) {
  const bookingEntries = Object.entries(bookingCounts) as Array<[BookingStatus, number]>;
  const paymentEntries = Object.entries(paymentCounts) as Array<[PaymentStatus, number]>;

  const bookingTotal = bookingEntries.reduce((sum, [, count]) => sum + count, 0);
  const paymentTotal = paymentEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <article className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-500">Tình trạng vận hành</h3>

      <div className="mt-4 space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Trạng thái đơn đặt</p>
          <div className="mt-2 space-y-2">
            {bookingEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{bookingLabels[status]}</span>
                  <span className="font-medium text-slate-500">{count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-cyan-500" style={{ width: `${ratio(count, bookingTotal)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Trạng thái thanh toán</p>
          <div className="mt-2 space-y-2">
            {paymentEntries.map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{paymentLabels[status]}</span>
                  <span className="font-medium text-slate-500">{count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${status === "PAID" ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${ratio(count, paymentTotal)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}



