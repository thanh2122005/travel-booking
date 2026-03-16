import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import type { DashboardTopTourItem } from "@/components/admin/dashboard/types";

type TopToursTableProps = {
  items: DashboardTopTourItem[];
};

export function TopToursTable({ items }: TopToursTableProps) {
  return (
    <section className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-500">Top tour doanh thu</h2>
        <Link href="/admin/tours" className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">
          Quản lý tour
        </Link>
      </div>

      {items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.1em] text-slate-500">
                <th className="px-2 py-2.5">Tour</th>
                <th className="px-2 py-2.5">Đơn xác nhận</th>
                <th className="px-2 py-2.5">Tỷ lệ thanh toán</th>
                <th className="px-2 py-2.5">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 6).map((tour) => {
                const paymentRate = tour.confirmedBookings
                  ? Math.round((tour.paidBookings / tour.confirmedBookings) * 100)
                  : 0;

                return (
                  <tr key={tour.tourId} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-2.5">
                      <Link href={`/tours/${tour.slug}`} className="font-medium text-slate-500 hover:text-cyan-700">
                        {tour.title}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 text-slate-500">{tour.confirmedBookings}</td>
                    <td className="px-2 py-2.5 text-slate-500">{paymentRate}%</td>
                    <td className="px-2 py-2.5 font-semibold text-slate-500">{formatPrice(tour.confirmedRevenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Chưa có dữ liệu top tour trong kỳ.
        </p>
      )}
    </section>
  );
}



