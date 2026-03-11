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
    <div className="space-y-5">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý booking</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi đơn đặt tour, trạng thái xử lý, thanh toán và cập nhật hàng loạt theo bộ lọc.
        </p>
      </div>

      <form className="iv-card p-4">
        <label
          htmlFor="search"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
        >
          Tìm kiếm booking
        </label>
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
      </form>

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
          description="Hãy thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem toàn bộ dữ liệu."
          ctaHref="/admin/bookings"
          ctaLabel="Xóa bộ lọc"
        />
      )}
    </div>
  );
}
