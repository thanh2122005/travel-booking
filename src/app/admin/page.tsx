import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminBookingRevenueChart } from "@/components/admin/admin-booking-revenue-chart";
import { EmptyState } from "@/components/common/empty-state";
import { adminLabels, getAdminDashboardData } from "@/lib/db/admin-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const requestedRange = Number(normalizeParam(params.range) || "6");
  const monthCount = [3, 6, 12].includes(requestedRange) ? requestedRange : 6;
  const data = await getAdminDashboardData({ monthCount }).catch(() => null);

  if (!data) {
    return (
      <EmptyState
        title="Không thể tải dữ liệu quản trị"
        description="Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
        ctaHref="/admin"
        ctaLabel="Thử lại"
      />
    );
  }

  const metricCards = [
    { label: "Tổng người dùng", value: data.metrics.totalUsers.toString() },
    { label: "Tổng tour", value: data.metrics.totalTours.toString() },
    { label: "Tổng điểm đến", value: data.metrics.totalLocations.toString() },
    { label: "Tổng đơn đặt", value: data.metrics.totalBookings.toString() },
    { label: "Tổng đánh giá", value: data.metrics.totalReviews.toString() },
    { label: "Doanh thu xác nhận", value: formatPrice(data.metrics.totalRevenue) },
  ];

  const rangeOptions = [3, 6, 12] as const;

  return (
    <div className="space-y-6">
      <section className="iv-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trang quản trị</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Tổng quan vận hành</h1>
        <p className="mt-2 text-sm text-slate-600">
          Theo dõi số liệu người dùng, tour, đơn đặt và đánh giá trong toàn bộ hệ thống.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((item) => (
          <article key={item.label} className="iv-card p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">Khoảng thời gian phân tích</p>
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((range) => (
              <Link
                key={range}
                href={{ pathname: "/admin", query: { ...params, range: String(range) } }}
                className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                  monthCount === range
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {range} tháng
              </Link>
            ))}
          </div>
        </div>
        <AdminBookingRevenueChart timeline={data.bookingRevenueTimeline} monthCount={monthCount} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="iv-card p-5">
          <h2 className="text-xl font-bold text-slate-900">Trạng thái đơn đặt tour</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(data.bookingsByStatus).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-500">{adminLabels.bookingStatus[status as keyof typeof adminLabels.bookingStatus]}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="iv-card p-5">
          <h2 className="text-xl font-bold text-slate-900">Trạng thái thanh toán</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(data.paymentsByStatus).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-500">{adminLabels.paymentStatus[status as keyof typeof adminLabels.paymentStatus]}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="iv-card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Đơn đặt tour gần đây</h2>
            <Link href="/admin/bookings" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentBookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{booking.bookingCode}</p>
                <p className="text-sm text-slate-600">
                  {booking.user.fullName} ·{" "}
                  <Link href={`/tours/${booking.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                    {booking.tour.title}
                  </Link>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{adminLabels.bookingStatus[booking.status]}</Badge>
                  <Badge variant="outline">{adminLabels.paymentStatus[booking.paymentStatus]}</Badge>
                  <span className="text-xs text-slate-500">{formatDate(booking.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="iv-card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Đánh giá mới nhất</h2>
            <Link href="/admin/reviews" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentReviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{review.user.fullName}</p>
                <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Tour:{" "}
                  <Link href={`/tours/${review.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                    {review.tour.title}
                  </Link>
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
