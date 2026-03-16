import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import type { DashboardTopTourItem } from "@/components/admin/dashboard/types";

type TopToursTableProps = {
  items: DashboardTopTourItem[];
  startDateLabel: string;
  endDateLabel: string;
};

export function TopToursTable({ items, startDateLabel, endDateLabel }: TopToursTableProps) {
  return (
    <section className="iv-card rounded-2xl border-slate-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Top tour theo doanh thu xác nhận</h2>
          <p className="mt-1 text-sm text-slate-500">
            Thống kê từ {startDateLabel} đến {endDateLabel}.
          </p>
        </div>
        <Link href="/admin/tours" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          Quản lý tour
        </Link>
      </div>

      {items.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                <th className="px-2 py-3">#</th>
                <th className="px-2 py-3">Tour</th>
                <th className="px-2 py-3">Đơn trong kỳ</th>
                <th className="px-2 py-3">Đơn xác nhận</th>
                <th className="px-2 py-3">Đơn đã thanh toán</th>
                <th className="px-2 py-3">Doanh thu xác nhận</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tour, index) => (
                <tr key={tour.tourId} className="border-b border-slate-100 text-slate-700 last:border-0">
                  <td className="px-2 py-3 font-semibold">{index + 1}</td>
                  <td className="px-2 py-3">
                    {tour.slug ? (
                      <Link href={`/tours/${tour.slug}`} className="font-semibold text-cyan-700 hover:text-cyan-800">
                        {tour.title}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-800">{tour.title}</span>
                    )}
                  </td>
                  <td className="px-2 py-3">{tour.bookings}</td>
                  <td className="px-2 py-3">{tour.confirmedBookings}</td>
                  <td className="px-2 py-3">{tour.paidBookings}</td>
                  <td className="px-2 py-3 font-semibold text-slate-800">{formatPrice(tour.confirmedRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Chưa có tour phát sinh doanh thu trong kỳ đã chọn.
        </p>
      )}
    </section>
  );
}
