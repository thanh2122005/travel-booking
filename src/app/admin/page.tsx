import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminBookingRevenueChart } from "@/components/admin/admin-booking-revenue-chart";
import { EmptyState } from "@/components/common/empty-state";
import { adminLabels, getAdminDashboardData } from "@/lib/db/admin-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type TimelineGranularity = "day" | "week" | "month";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const rangeOptions = [30, 90, 180, 365] as const;

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseRangeDays(value: string) {
  const number = Number(value || "180");
  if (!Number.isFinite(number)) return 180;
  return rangeOptions.includes(number as (typeof rangeOptions)[number]) ? number : 180;
}

function parseGranularity(value: string): TimelineGranularity | undefined {
  if (value === "day" || value === "week" || value === "month") {
    return value;
  }
  return undefined;
}

function toInputDateValue(date: Date) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;

  const rangeDays = parseRangeDays(normalizeParam(params.rangeDays));
  const granularity = parseGranularity(normalizeParam(params.granularity));
  const startDate = normalizeParam(params.startDate);
  const endDate = normalizeParam(params.endDate);

  const hasCustomDateRange = Boolean(startDate || endDate);
  const data = await getAdminDashboardData({
    ...(hasCustomDateRange
      ? {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }
      : {
          rangeDays,
        }),
    ...(granularity ? { granularity } : {}),
  }).catch(() => null);

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

  return (
    <div className="space-y-6">
      <section className="iv-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trang quản trị</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Tổng quan vận hành</h1>
        <p className="mt-2 text-sm text-slate-600">
          Theo dõi dữ liệu người dùng, tour, đơn đặt, đánh giá và doanh thu theo mốc thời gian chi
          tiết.
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

      <section className="space-y-4">
        <form className="iv-card p-4">
          <p className="text-sm font-semibold text-slate-700">Bộ lọc thời gian doanh thu</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {rangeOptions.map((value) => {
              const active = !hasCustomDateRange && rangeDays === value;
              return (
                <Link
                  key={value}
                  href={{
                    pathname: "/admin",
                    query: {
                      ...params,
                      rangeDays: String(value),
                      startDate: "",
                      endDate: "",
                    },
                  }}
                  className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                    active
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {value} ngày
                </Link>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-[170px_180px_180px_auto]">
            <select
              name="granularity"
              defaultValue={data.timelineGranularity}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate || toInputDateValue(data.timelineStartDate)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
            <input
              type="date"
              name="endDate"
              defaultValue={endDate || toInputDateValue(data.timelineEndDate)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
            >
              Áp dụng khoảng tùy chọn
            </button>
          </div>
        </form>

        <AdminBookingRevenueChart
          timeline={data.bookingRevenueTimeline}
          granularity={data.timelineGranularity}
          startDateLabel={formatDate(data.timelineStartDate)}
          endDateLabel={formatDate(data.timelineEndDate)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="iv-card p-5">
          <h2 className="text-xl font-bold text-slate-900">Trạng thái đơn đặt tour</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(data.bookingsByStatus).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-500">
                  {adminLabels.bookingStatus[status as keyof typeof adminLabels.bookingStatus]}
                </p>
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
                <p className="text-sm text-slate-500">
                  {adminLabels.paymentStatus[status as keyof typeof adminLabels.paymentStatus]}
                </p>
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
