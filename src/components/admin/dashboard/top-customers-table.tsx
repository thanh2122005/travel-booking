import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import type { DashboardTopCustomerItem } from "@/components/admin/dashboard/types";

type TopCustomersTableProps = {
  items: DashboardTopCustomerItem[];
};

export function TopCustomersTable({ items }: TopCustomersTableProps) {
  return (
    <section className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-700">Top khách đặt tour</h2>
        <Link href="/admin/users" className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">
          Quản lý người dùng
        </Link>
      </div>

      {items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.1em] text-slate-500">
                <th className="px-2 py-2.5">Khách hàng</th>
                <th className="px-2 py-2.5">Đơn trong kỳ</th>
                <th className="px-2 py-2.5">Đơn xác nhận</th>
                <th className="px-2 py-2.5">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 6).map((customer) => (
                <tr key={customer.userId} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-2.5">
                    <p className="font-medium text-slate-700">{customer.fullName}</p>
                    <p className="text-xs text-slate-500">{customer.email}</p>
                  </td>
                  <td className="px-2 py-2.5 text-slate-500">{customer.bookings}</td>
                  <td className="px-2 py-2.5 text-slate-500">{customer.confirmedBookings}</td>
                  <td className="px-2 py-2.5 font-semibold text-slate-700">
                    {formatPrice(customer.confirmedRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Chưa có dữ liệu top khách hàng trong kỳ.
        </p>
      )}
    </section>
  );
}
