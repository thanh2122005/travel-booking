import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { adminLabels, getAdminBookings } from "@/lib/db/admin-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminBookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const page = Number(normalizeParam(params.page) || "1");

  const data = await getAdminBookings({
    search: search || undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 15,
  }).catch(() => null);

  if (!data) {
    return (
      <EmptyState
        title="Không thể tải danh sách booking"
        description="Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
        ctaHref="/admin/bookings"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý booking</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi đơn đặt tour, trạng thái xử lý và thanh toán.</p>
      </div>

      <form className="iv-card p-4">
        <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm kiếm booking
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Mã đơn, tên khách, email hoặc tên tour..."
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            Tìm kiếm
          </button>
        </div>
      </form>

      {data.items.length ? (
        <>
          <div className="iv-card overflow-x-auto p-4">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-3 font-medium">Mã đơn</th>
                  <th className="px-2 py-3 font-medium">Khách hàng</th>
                  <th className="px-2 py-3 font-medium">Tour</th>
                  <th className="px-2 py-3 font-medium">Số khách</th>
                  <th className="px-2 py-3 font-medium">Tổng tiền</th>
                  <th className="px-2 py-3 font-medium">Trạng thái</th>
                  <th className="px-2 py-3 font-medium">Thanh toán</th>
                  <th className="px-2 py-3 font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-3 font-semibold text-slate-800">{booking.bookingCode}</td>
                    <td className="px-2 py-3">
                      <p className="font-medium text-slate-800">{booking.fullName}</p>
                      <p className="text-xs text-slate-500">{booking.email}</p>
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/tours/${booking.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                        {booking.tour.title}
                      </Link>
                    </td>
                    <td className="px-2 py-3">{booking.numberOfGuests}</td>
                    <td className="px-2 py-3 font-medium">{formatPrice(booking.totalPrice)}</td>
                    <td className="px-2 py-3">
                      <Badge variant="outline">{adminLabels.bookingStatus[booking.status]}</Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant="outline">{adminLabels.paymentStatus[booking.paymentStatus]}</Badge>
                    </td>
                    <td className="px-2 py-3 text-slate-500">{formatDate(booking.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} booking
            </p>
            <div className="flex gap-2">
              <Link
                href={{
                  pathname: "/admin/bookings",
                  query: {
                    ...params,
                    page: String(Math.max(data.page - 1, 1)),
                  },
                }}
                className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
              >
                Trang trước
              </Link>
              <Link
                href={{
                  pathname: "/admin/bookings",
                  query: {
                    ...params,
                    page: String(Math.min(data.page + 1, data.totalPages)),
                  },
                }}
                className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
              >
                Trang sau
              </Link>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Không có booking phù hợp"
          description="Hãy thử từ khóa khác để tìm kiếm."
          ctaHref="/admin/bookings"
          ctaLabel="Xóa bộ lọc"
        />
      )}
    </div>
  );
}
