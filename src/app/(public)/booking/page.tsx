import Link from "next/link";
import { CalendarCheck2, CreditCard, FileCheck2, UserRoundCheck } from "lucide-react";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { Badge } from "@/components/ui/badge";
import { getAuthSession } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/db/user-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type BookingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentStatusValue = "UNPAID" | "PAID";

const bookingStatusLabels: Record<BookingStatusValue, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn thành",
};

const paymentStatusLabels: Record<PaymentStatusValue, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
};

const bookingSteps = [
  {
    icon: CalendarCheck2,
    title: "1. Chọn tour và ngày khởi hành",
    description: "Tìm tour phù hợp, xem itinerary, giá, số khách tối đa và bổ sung ghi chú.",
  },
  {
    icon: UserRoundCheck,
    title: "2. Xác nhận thông tin",
    description: "Nhập thông tin liên hệ, số khách và gửi yêu cầu đặt tour qua biểu mẫu đặt tour.",
  },
  {
    icon: FileCheck2,
    title: "3. Đợi xác nhận",
    description: "Đơn đặt tour sẽ được duyệt và cập nhật trạng thái trực tiếp trong tài khoản của bạn.",
  },
  {
    icon: CreditCard,
    title: "4. Thanh toán",
    description: "Theo dõi trạng thái thanh toán và thông tin đơn trong dashboard người dùng.",
  },
];

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseStatus(value: string): BookingStatusValue | "" {
  if (value === "PENDING" || value === "CONFIRMED" || value === "CANCELLED" || value === "COMPLETED") {
    return value;
  }
  return "";
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const status = parseStatus(normalizeParam(params.status));
  const hasActiveFilters = Boolean(search || status);
  const normalizedSearch = search.trim().toLowerCase();

  const session = await getAuthSession();
  const dashboard = session?.user?.id ? await getUserDashboardData(session.user.id).catch(() => null) : null;
  const bookings = dashboard?.bookings ?? [];

  const filteredBookings = bookings.filter((booking) => {
    const searchMatched =
      !normalizedSearch ||
      booking.bookingCode.toLowerCase().includes(normalizedSearch) ||
      booking.tour.title.toLowerCase().includes(normalizedSearch) ||
      booking.tour.departureLocation.toLowerCase().includes(normalizedSearch);
    const statusMatched = !status || booking.status === status;
    return searchMatched && statusMatched;
  });
  const visibleBookings = filteredBookings.slice(0, 12);
  const countByStatus: Record<BookingStatusValue, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
  };

  for (const booking of filteredBookings) {
    const normalizedStatus = booking.status as BookingStatusValue;
    if (normalizedStatus in countByStatus) {
      countByStatus[normalizedStatus] += 1;
    }
  }

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Quy trình đặt tour"
        title="Đặt tour rõ ràng và dễ theo dõi"
        description="Theo dõi toàn bộ quy trình đặt tour từ lúc chọn lịch trình đến khi xác nhận đơn và thanh toán."
        imageSrc="/immerse-vietnam/images/header-bg.jpg"
      />

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Cách hoạt động"
          title="Quy trình đặt tour 4 bước"
          description="Mỗi bước đều rõ ràng để bạn dễ thao tác và theo dõi trạng thái đặt tour."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {bookingSteps.map((step) => (
            <article key={step.title} className="iv-card p-5">
              <step.icon className="h-7 w-7 text-teal-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HomeSectionHeading
            eyebrow="Đơn gần đây"
            title="Đơn đặt tour gần đây của bạn"
            description={`Hiển thị ${filteredBookings.length}/${bookings.length} đơn theo bộ lọc hiện tại.`}
          />
          <Link href="/tours" className="iv-btn-soft inline-flex h-10 items-center px-4 text-sm font-semibold">
            Tìm và đặt tour mới
          </Link>
        </div>

        <form className="iv-card p-4">
          <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Tìm kiếm đơn đặt tour
          </label>
          <div className="grid gap-2 md:grid-cols-[1fr_200px_auto_auto]">
            <input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Mã đơn, tên tour hoặc điểm khởi hành..."
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <button
              type="submit"
              className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
            >
              Áp dụng
            </button>
            {hasActiveFilters ? (
              <Link
                href="/booking"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>
        </form>

        {filteredBookings.length ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Chờ xác nhận</p>
              <p className="mt-1 text-xl font-bold text-amber-900">{countByStatus.PENDING}</p>
            </article>
            <article className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Đã xác nhận</p>
              <p className="mt-1 text-xl font-bold text-cyan-900">{countByStatus.CONFIRMED}</p>
            </article>
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Hoàn thành</p>
              <p className="mt-1 text-xl font-bold text-emerald-900">{countByStatus.COMPLETED}</p>
            </article>
            <article className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">Đã hủy</p>
              <p className="mt-1 text-xl font-bold text-rose-900">{countByStatus.CANCELLED}</p>
            </article>
          </div>
        ) : null}

        {filteredBookings.length ? (
          <div className="space-y-3">
            <div className="grid gap-3 lg:hidden">
              {visibleBookings.map((booking) => (
                <article key={booking.id} className="iv-card space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Mã đơn</p>
                      <p className="text-base font-semibold text-slate-900">{booking.bookingCode}</p>
                    </div>
                    <Badge variant="outline">{bookingStatusLabels[booking.status as BookingStatusValue] ?? booking.status}</Badge>
                  </div>

                  <div className="space-y-1">
                    <Link href={`/tours/${booking.tour.slug}`} className="line-clamp-2 font-semibold text-slate-900 hover:text-teal-700">
                      {booking.tour.title}
                    </Link>
                    <p className="text-sm text-slate-500">Khởi hành từ: {booking.tour.departureLocation}</p>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-slate-500">Số khách</dt>
                      <dd className="font-medium text-slate-800">{booking.numberOfGuests}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Tổng tiền</dt>
                      <dd className="font-semibold text-teal-700">{formatPrice(booking.totalPrice)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Thanh toán</dt>
                      <dd className="mt-0.5">
                        <Badge variant="outline">{paymentStatusLabels[booking.paymentStatus as PaymentStatusValue] ?? booking.paymentStatus}</Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Ngày tạo</dt>
                      <dd className="font-medium text-slate-800">{formatDate(booking.createdAt)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            <div className="hidden lg:block">
              <div className="iv-card overflow-x-auto p-4">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-2 py-3 font-medium">Mã đơn</th>
                      <th className="px-2 py-3 font-medium">Tour</th>
                      <th className="px-2 py-3 font-medium">Khách</th>
                      <th className="px-2 py-3 font-medium">Tổng tiền</th>
                      <th className="px-2 py-3 font-medium">Trạng thái</th>
                      <th className="px-2 py-3 font-medium">Thanh toán</th>
                      <th className="px-2 py-3 font-medium">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-2 py-3 font-semibold text-slate-800">{booking.bookingCode}</td>
                        <td className="px-2 py-3">
                          <Link href={`/tours/${booking.tour.slug}`} className="font-medium text-slate-800 hover:text-teal-700">
                            {booking.tour.title}
                          </Link>
                          <p className="text-xs text-slate-500">Khởi hành từ: {booking.tour.departureLocation}</p>
                        </td>
                        <td className="px-2 py-3">{booking.numberOfGuests}</td>
                        <td className="px-2 py-3 font-medium">{formatPrice(booking.totalPrice)}</td>
                        <td className="px-2 py-3">
                          <Badge variant="outline">{bookingStatusLabels[booking.status as BookingStatusValue] ?? booking.status}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <Badge variant="outline">{paymentStatusLabels[booking.paymentStatus as PaymentStatusValue] ?? booking.paymentStatus}</Badge>
                        </td>
                        <td className="px-2 py-3 text-slate-500">{formatDate(booking.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredBookings.length > visibleBookings.length ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                Đang hiển thị {visibleBookings.length} / {filteredBookings.length} đơn gần nhất theo bộ lọc hiện tại.
              </p>
            ) : null}
          </div>
        ) : bookings.length ? (
          <EmptyState
            title="Không tìm thấy đơn phù hợp"
            description="Hãy thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ đơn đặt tour."
            ctaHref="/booking"
            ctaLabel="Xóa bộ lọc"
          />
        ) : session?.user ? (
          <EmptyState
            title="Bạn chưa có đơn đặt tour"
            description="Hãy chọn một tour phù hợp và bắt đầu hành trình đầu tiên."
            ctaHref="/tours"
            ctaLabel="Xem danh sách tour"
          />
        ) : (
          <EmptyState
            title="Đăng nhập để theo dõi đơn đặt tour"
            description="Bạn cần đăng nhập để xem lịch sử đặt tour và quản lý các đơn đã đặt."
            ctaHref="/dang-nhap?callbackUrl=/booking"
            ctaLabel="Đăng nhập ngay"
          />
        )}
      </section>
    </div>
  );
}
