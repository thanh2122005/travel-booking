import { formatPrice } from "@/lib/utils/format";

type TimelineItem = {
  monthKey: string;
  label: string;
  bookings: number;
  confirmedRevenue: number;
};

type AdminBookingRevenueChartProps = {
  timeline: TimelineItem[];
};

export function AdminBookingRevenueChart({ timeline }: AdminBookingRevenueChartProps) {
  if (!timeline.length) {
    return (
      <article className="iv-card p-5">
        <h2 className="text-xl font-bold text-slate-900">Xu hướng đặt tour và doanh thu</h2>
        <p className="mt-3 text-sm text-slate-600">Chưa có dữ liệu trong giai đoạn gần đây.</p>
      </article>
    );
  }

  const maxBookings = Math.max(...timeline.map((item) => item.bookings), 1);
  const maxRevenue = Math.max(...timeline.map((item) => item.confirmedRevenue), 1);

  return (
    <article className="iv-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Xu hướng đặt tour và doanh thu</h2>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi 6 tháng gần nhất để nhận diện mùa cao điểm và hiệu suất bán tour.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-500" />
            Đơn đặt
          </p>
          <p className="mt-1 inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-600" />
            Doanh thu xác nhận
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {timeline.map((item) => (
          <div key={item.monthKey} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Tháng {item.label}</p>
              <p className="text-xs text-slate-500">
                {item.bookings} đơn · {formatPrice(item.confirmedRevenue)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-slate-500">Đơn đặt</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${Math.max((item.bookings / maxBookings) * 100, 4)}%` }}
                  />
                </div>
                <span className="w-9 text-right text-xs font-semibold text-slate-700">{item.bookings}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-slate-500">Doanh thu</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-600"
                    style={{ width: `${Math.max((item.confirmedRevenue / maxRevenue) * 100, 4)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700">{formatPrice(item.confirmedRevenue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
