import Link from "next/link";
import { CalendarCheck2, CreditCard, FileCheck2, List, ListFilter, UserCircle2, UserRoundCheck } from "lucide-react";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { BookingCancelButton } from "@/components/booking/booking-cancel-button";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { Badge } from "@/components/ui/badge";
import { getAuthSession } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/db/user-queries";
import { buildAliasRedirectPath } from "@/lib/utils/alias-redirect";
import { canCancelBooking } from "@/lib/utils/booking-actions";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type BookingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentStatusValue = "UNPAID" | "PAID";
type BookingQueryOverrides = {
  search?: string;
  status?: BookingStatusValue | "";
  paymentStatus?: PaymentStatusValue | "";
  createdFrom?: string;
  createdTo?: string;
  page?: number;
};

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
const quickDateRanges = [7, 30, 90] as const;

const bookingSteps = [
  {
    icon: CalendarCheck2,
    title: "1. Chọn tour và ngày khởi hành",
    description: "Tìm tour phù hợp, xem lịch trình, giá, số khách tối đa và bổ sung ghi chú.",
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
    description: "Theo dõi trạng thái thanh toán và thông tin đơn trong trang tài khoản.",
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

function parsePaymentStatus(value: string): PaymentStatusValue | "" {
  if (value === "UNPAID" || value === "PAID") {
    return value;
  }
  return "";
}

function parsePage(value: string) {
  const page = Number(value);
  if (!Number.isFinite(page)) return 1;
  const normalized = Math.trunc(page);
  return normalized >= 1 ? normalized : 1;
}

function parseDateAtBoundary(value: string, boundary: "start" | "end") {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  if (boundary === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function toInputDateValue(date: Date) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function createQuickDateRange(days: number) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  return {
    createdFrom: toInputDateValue(start),
    createdTo: toInputDateValue(end),
  };
}

function formatInputDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function buildDateRangeLabel(createdFrom: string, createdTo: string) {
  if (createdFrom && createdTo) {
    return `Ngày tạo: ${formatInputDate(createdFrom)} - ${formatInputDate(createdTo)}`;
  }
  if (createdFrom) {
    return `Từ ngày: ${formatInputDate(createdFrom)}`;
  }
  if (createdTo) {
    return `Đến ngày: ${formatInputDate(createdTo)}`;
  }
  return "";
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const status = parseStatus(normalizeParam(params.status));
  const paymentStatus = parsePaymentStatus(normalizeParam(params.paymentStatus));
  const createdFrom = normalizeParam(params.createdFrom);
  const createdTo = normalizeParam(params.createdTo);
  const requestedPage = parsePage(normalizeParam(params.page));
  const hasActiveFilters = Boolean(search || status || paymentStatus || createdFrom || createdTo);
  const normalizedSearch = search.trim().toLowerCase();

  const session = await getAuthSession();
  const dashboard = session?.user?.id ? await getUserDashboardData(session.user.id).catch(() => null) : null;
  const bookings = dashboard?.bookings ?? [];
  const loginHref = `/dang-nhap?callbackUrl=${encodeURIComponent(
    buildAliasRedirectPath("/booking", params),
  )}`;

  const searchMatchedBookings = bookings.filter((booking) => {
    return (
      !normalizedSearch ||
      booking.bookingCode.toLowerCase().includes(normalizedSearch) ||
      booking.tour.title.toLowerCase().includes(normalizedSearch) ||
      booking.tour.departureLocation.toLowerCase().includes(normalizedSearch)
    );
  });
  const createdFromDate = parseDateAtBoundary(createdFrom, "start");
  const createdToDate = parseDateAtBoundary(createdTo, "end");
  const dateFilteredBookings = searchMatchedBookings.filter((booking) => {
    const createdAt = new Date(booking.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return true;
    }

    if (createdFromDate && createdAt < createdFromDate) {
      return false;
    }
    if (createdToDate && createdAt > createdToDate) {
      return false;
    }
    return true;
  });
  const statusFilterBaseBookings = dateFilteredBookings.filter(
    (booking) => !paymentStatus || booking.paymentStatus === paymentStatus,
  );
  const filteredBookings = statusFilterBaseBookings.filter((booking) => !status || booking.status === status);
  const paymentFilterBaseBookings = dateFilteredBookings.filter((booking) => !status || booking.status === status);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const buildBookingHref = (overrides: BookingQueryOverrides = {}) => {
    const nextSearch = overrides.search ?? search;
    const nextStatus = overrides.status ?? status;
    const nextPaymentStatus = overrides.paymentStatus ?? paymentStatus;
    const nextCreatedFrom = overrides.createdFrom ?? createdFrom;
    const nextCreatedTo = overrides.createdTo ?? createdTo;
    const nextPage = overrides.page ?? currentPage;
    const query = new URLSearchParams();

    if (nextSearch) {
      query.set("search", nextSearch);
    }
    if (nextStatus) {
      query.set("status", nextStatus);
    }
    if (nextPaymentStatus) {
      query.set("paymentStatus", nextPaymentStatus);
    }
    if (nextCreatedFrom) {
      query.set("createdFrom", nextCreatedFrom);
    }
    if (nextCreatedTo) {
      query.set("createdTo", nextCreatedTo);
    }
    if (nextPage > 1) {
      query.set("page", String(nextPage));
    }

    const serialized = query.toString();
    return serialized ? `/booking?${serialized}` : "/booking";
  };

  const buildPageHref = (page: number) => buildBookingHref({ page });
  const clearFiltersHref = buildBookingHref({
    search: "",
    status: "",
    paymentStatus: "",
    createdFrom: "",
    createdTo: "",
    page: 1,
  });
  const dateRangeLabel = buildDateRangeLabel(createdFrom, createdTo);
  const activeFilterLabels = [
    ...(search ? [`Từ khóa: ${search}`] : []),
    ...(status ? [`Trạng thái: ${bookingStatusLabels[status]}`] : []),
    ...(paymentStatus ? [`Thanh toán: ${paymentStatusLabels[paymentStatus]}`] : []),
    ...(dateRangeLabel ? [dateRangeLabel] : []),
  ];
  const countByStatus: Record<BookingStatusValue, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
  };
  const countByPayment: Record<PaymentStatusValue, number> = {
    UNPAID: 0,
    PAID: 0,
  };

  for (const booking of statusFilterBaseBookings) {
    const normalizedStatus = booking.status as BookingStatusValue;
    if (normalizedStatus in countByStatus) {
      countByStatus[normalizedStatus] += 1;
    }
  }
  for (const booking of paymentFilterBaseBookings) {
    const normalizedPaymentStatus = booking.paymentStatus as PaymentStatusValue;
    if (normalizedPaymentStatus in countByPayment) {
      countByPayment[normalizedPaymentStatus] += 1;
    }
  }

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <PageHeroBanner
        eyebrow="Quy trình đặt tour"
        title="Đặt tour rõ ràng và dễ theo dõi"
        description="Theo dõi toàn bộ quy trình đặt tour từ lúc chọn lịch trình đến khi xác nhận đơn và thanh toán."
        imageSrc="/immerse-vietnam/images/header-bg.jpg"
      />

      <section id="quy-trinh-dat-tour" className="scroll-mt-24 space-y-5">
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

      <section id="don-dat-tour" className="scroll-mt-24 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HomeSectionHeading
            eyebrow="Đơn gần đây"
            title="Đơn đặt tour gần đây của bạn"
            description={`Hiển thị ${visibleBookings.length}/${filteredBookings.length} đơn trên trang ${currentPage}/${totalPages}.`}
          />
          <Link href="/tours" className="iv-btn-soft inline-flex h-10 items-center px-4 text-sm font-semibold">
            Tìm và đặt tour mới
          </Link>
        </div>

        <div id="bo-loc-don" className="scroll-mt-24" />
        <form className="iv-card p-4">
          <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Tìm kiếm đơn đặt tour
          </label>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Mốc nhanh:</span>
            {quickDateRanges.map((days) => {
              const quickRange = createQuickDateRange(days);
              const isActive =
                createdFrom === quickRange.createdFrom && createdTo === quickRange.createdTo;
              return (
                <Link
                  key={days}
                  href={buildBookingHref({
                    createdFrom: quickRange.createdFrom,
                    createdTo: quickRange.createdTo,
                    page: 1,
                  })}
                  className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                    isActive
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {days} ngày
                </Link>
              );
            })}
            {hasActiveFilters ? (
              <Link
                href={clearFiltersHref}
                className="inline-flex h-8 items-center rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Xóa lọc nhanh
              </Link>
            ) : null}
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_160px_170px_170px_170px_auto_auto]">
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
            <select
              name="paymentStatus"
              defaultValue={paymentStatus}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Tất cả thanh toán</option>
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
            </select>
            <input
              type="date"
              name="createdFrom"
              defaultValue={createdFrom}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
            <input
              type="date"
              name="createdTo"
              defaultValue={createdTo}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
            >
              Lọc đơn
            </button>
            {hasActiveFilters ? (
              <Link
                href={clearFiltersHref}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>
          {activeFilterLabels.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilterLabels.map((label) => (
                <Badge key={label} variant="outline" className="bg-slate-50 text-xs text-slate-700">
                  {label}
                </Badge>
              ))}
            </div>
          ) : null}
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

        {statusFilterBaseBookings.length ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildBookingHref({ status: "", page: 1 })}
              className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                !status
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Tất cả ({statusFilterBaseBookings.length})
            </Link>
            {(Object.keys(bookingStatusLabels) as BookingStatusValue[]).map((statusValue) => (
              <Link
                key={statusValue}
                href={buildBookingHref({ status: statusValue, page: 1 })}
                className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                  status === statusValue
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {bookingStatusLabels[statusValue]} ({countByStatus[statusValue]})
              </Link>
            ))}
          </div>
        ) : null}
        {paymentFilterBaseBookings.length ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildBookingHref({ paymentStatus: "", page: 1 })}
              className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                !paymentStatus
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Tất cả thanh toán ({paymentFilterBaseBookings.length})
            </Link>
            {(Object.keys(paymentStatusLabels) as PaymentStatusValue[]).map((paymentStatusValue) => (
              <Link
                key={paymentStatusValue}
                href={buildBookingHref({ paymentStatus: paymentStatusValue, page: 1 })}
                className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                  paymentStatus === paymentStatusValue
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {paymentStatusLabels[paymentStatusValue]} ({countByPayment[paymentStatusValue]})
              </Link>
            ))}
          </div>
        ) : null}

        <div id="danh-sach-don" className="scroll-mt-24" />
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
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Link
                      href={`/tours/${booking.tour.slug}`}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Xem tour
                    </Link>
                    {canCancelBooking(booking.status, booking.paymentStatus) ? (
                      <BookingCancelButton
                        bookingId={booking.id}
                        bookingCode={booking.bookingCode}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-70"
                      />
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden lg:block">
              <div className="iv-card overflow-x-auto p-4">
                <table className="w-full min-w-[1080px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-2 py-3 font-medium">Mã đơn</th>
                      <th className="px-2 py-3 font-medium">Tour</th>
                      <th className="px-2 py-3 font-medium">Khách</th>
                      <th className="px-2 py-3 font-medium">Tổng tiền</th>
                      <th className="px-2 py-3 font-medium">Trạng thái</th>
                      <th className="px-2 py-3 font-medium">Thanh toán</th>
                      <th className="px-2 py-3 font-medium">Ngày tạo</th>
                      <th className="px-2 py-3 font-medium">Thao tác</th>
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
                        <td className="px-2 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/tours/${booking.tour.slug}`}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Xem tour
                            </Link>
                            {canCancelBooking(booking.status, booking.paymentStatus) ? (
                              <BookingCancelButton
                                bookingId={booking.id}
                                bookingCode={booking.bookingCode}
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-70"
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-slate-600">
                  Trang <span className="font-semibold text-slate-900">{currentPage}</span> / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageHref(currentPage - 1)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 font-medium text-slate-700 transition hover:bg-white"
                    >
                      Trang trước
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 font-medium text-slate-400">
                      Trang trước
                    </span>
                  )}
                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageHref(currentPage + 1)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 font-medium text-slate-700 transition hover:bg-white"
                    >
                      Trang sau
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 font-medium text-slate-400">
                      Trang sau
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : bookings.length ? (
          <EmptyState
            title="Không tìm thấy đơn phù hợp"
            description="Hãy thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ đơn đặt tour."
            ctaHref={clearFiltersHref}
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
            ctaHref={loginHref}
            ctaLabel="Đăng nhập ngay"
          />
        )}
      </section>

      <MobileQuickActions
        items={[
          { href: "#bo-loc-don", label: "Lọc đơn", icon: ListFilter },
          { href: "#danh-sach-don", label: "Danh sách", icon: List, active: true },
          { href: "/tai-khoan#booking", label: "Tài khoản", icon: UserCircle2 },
        ]}
      />
    </div>
  );
}
