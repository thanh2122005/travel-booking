import Link from "next/link";
import { AdminBookingsTable } from "@/components/admin/admin-bookings-table";
import { EmptyState } from "@/components/common/empty-state";
import { adminLabels, getAdminBookings } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentStatusValue = "UNPAID" | "PAID";

type AdminBookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const bookingStatusValues: BookingStatusValue[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
const paymentStatusValues: PaymentStatusValue[] = ["UNPAID", "PAID"];
const quickDateRanges = [7, 30, 90] as const;

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
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

function toValidPage(value: string) {
  const page = Number(value || "1");
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.trunc(page);
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

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const statusRaw = normalizeParam(params.status);
  const paymentStatusRaw = normalizeParam(params.paymentStatus);
  const createdFrom = normalizeParam(params.createdFrom);
  const createdTo = normalizeParam(params.createdTo);
  const page = toValidPage(normalizeParam(params.page));

  const status = bookingStatusValues.includes(statusRaw as BookingStatusValue)
    ? (statusRaw as BookingStatusValue)
    : undefined;
  const paymentStatus = paymentStatusValues.includes(paymentStatusRaw as PaymentStatusValue)
    ? (paymentStatusRaw as PaymentStatusValue)
    : undefined;
  const hasActiveFilters = Boolean(search || status || paymentStatus || createdFrom || createdTo);
  const exportQuery = {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
  };

  const data = await getAdminBookings({
    search: search || undefined,
    status,
    paymentStatus,
    createdFrom: parseDateAtBoundary(createdFrom, "start"),
    createdTo: parseDateAtBoundary(createdTo, "end"),
    page,
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
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý booking</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi đơn đặt tour, trạng thái xử lý, thanh toán và cập nhật hàng loạt theo bộ lọc.
        </p>
      </div>

      <section className="iv-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Đi đến nhanh</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="#bo-loc-booking"
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Bộ lọc booking
          </a>
          <a
            href="#danh-sach-booking"
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Danh sách
          </a>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
          >
            Dashboard
          </Link>
        </div>
      </section>

      <form id="bo-loc-booking" className="iv-card scroll-mt-24 p-4">
        <label
          htmlFor="search"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
        >
          Tìm kiếm booking
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
                href={{
                  pathname: "/admin/bookings",
                  query: {
                    ...params,
                    createdFrom: quickRange.createdFrom,
                    createdTo: quickRange.createdTo,
                    page: "1",
                  },
                }}
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
              href="/admin/bookings"
              className="inline-flex h-8 items-center rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Xóa bộ lọc
            </Link>
          ) : null}
        </div>
        <div className="grid gap-2 lg:grid-cols-[1fr_170px_170px_170px_170px_auto]">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Mã đơn, tên khách, email hoặc tên tour..."
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả trạng thái đơn</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
          <select
            name="paymentStatus"
            defaultValue={paymentStatus ?? ""}
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
            Lọc dữ liệu
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <Link
            href={{
              pathname: "/api/admin/bookings/export",
              query: exportQuery,
            }}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Xuất CSV
          </Link>
        </div>
      </form>

      <div id="danh-sach-booking" className="scroll-mt-24" />
      {data.items.length ? (
        <>
          <AdminBookingsTable
            items={data.items}
            statusLabels={adminLabels.bookingStatus}
            paymentLabels={adminLabels.paymentStatus}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} booking
            </p>
            <div className="flex gap-2">
              {data.page > 1 ? (
                <Link
                  href={{
                    pathname: "/admin/bookings",
                    query: {
                      ...params,
                      page: String(data.page - 1),
                    },
                  }}
                  className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
                >
                  Trang trước
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
                  Trang trước
                </span>
              )}
              {data.page < data.totalPages ? (
                <Link
                  href={{
                    pathname: "/admin/bookings",
                    query: {
                      ...params,
                      page: String(data.page + 1),
                    },
                  }}
                  className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
                >
                  Trang sau
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
                  Trang sau
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Không có booking phù hợp"
          description="Hãy thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem toàn bộ dữ liệu."
          ctaHref="/admin/bookings"
          ctaLabel="Xóa bộ lọc"
        />
      )}

      <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">
        <a
          href="#bo-loc-booking"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Bộ lọc
        </a>
        <a
          href="#danh-sach-booking"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Danh sách
        </a>
        <Link
          href="/admin/reviews"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
        >
          Reviews
        </Link>
      </div>
    </div>
  );
}
