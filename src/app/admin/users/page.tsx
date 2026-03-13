import Link from "next/link";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { AdminUserDetailDialog } from "@/components/admin/admin-user-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { adminLabels, getAdminUsers } from "@/lib/db/admin-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
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

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const role = normalizeParam(params.role);
  const status = normalizeParam(params.status);
  const createdFrom = normalizeParam(params.createdFrom);
  const createdTo = normalizeParam(params.createdTo);
  const page = toValidPage(normalizeParam(params.page));
  const hasActiveFilters = Boolean(search || role || status || createdFrom || createdTo);

  const data = await getAdminUsers({
    search: search || undefined,
    role: role ? (role as "ADMIN" | "USER") : undefined,
    status: status ? (status as "ACTIVE" | "BLOCKED") : undefined,
    createdFrom: parseDateAtBoundary(createdFrom, "start"),
    createdTo: parseDateAtBoundary(createdTo, "end"),
    page,
    pageSize: 12,
  }).catch(() => null);

  if (!data) {
    return (
      <EmptyState
        title="Không thể tải danh sách người dùng"
        description="Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
        ctaHref="/admin/users"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi tài khoản, vai trò, trạng thái và mức độ hoạt động.</p>
      </div>

      <form id="bo-loc-nguoi-dung" className="iv-card scroll-mt-24 p-4">
        <input type="hidden" name="page" value="1" />
        <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm kiếm người dùng
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
                  pathname: "/admin/users",
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
        </div>
        <div className="grid gap-2 xl:grid-cols-[1fr_180px_180px_170px_170px_auto_auto]">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Tên hoặc email..."
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            name="role"
            defaultValue={role}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">Người dùng</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="BLOCKED">Bị khóa</option>
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
          <button type="submit" className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            Tìm kiếm
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/users"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Xóa lọc
            </Link>
          ) : null}
        </div>
      </form>

      <div id="danh-sach-nguoi-dung" className="scroll-mt-24" />
      {data.items.length ? (
        <>
          <div className="space-y-3 lg:hidden">
            {data.items.map((user) => (
              <article key={user.id} className="iv-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>
                    {adminLabels.userStatus[user.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">SĐT: {user.phone || "-"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{adminLabels.userRole[user.role]}</Badge>
                  <Badge variant="outline">Đơn: {user._count.bookings}</Badge>
                  <Badge variant="outline">Đánh giá: {user._count.reviews}</Badge>
                  <Badge variant="outline">Yêu thích: {user._count.favorites}</Badge>
                </div>
                <p className="mt-3 text-xs text-slate-500">Ngày tạo: {formatDate(user.createdAt)}</p>
                <div className="mt-3 space-y-2">
                  <AdminUserActions userId={user.id} role={user.role} status={user.status} />
                  <AdminUserDetailDialog user={user} />
                </div>
              </article>
            ))}
          </div>

          <div className="iv-card hidden overflow-x-auto p-4 lg:block">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-3 font-medium">Họ tên</th>
                  <th className="px-2 py-3 font-medium">Email</th>
                  <th className="px-2 py-3 font-medium">Số điện thoại</th>
                  <th className="px-2 py-3 font-medium">Vai trò</th>
                  <th className="px-2 py-3 font-medium">Trạng thái</th>
                  <th className="px-2 py-3 font-medium">Đơn đặt</th>
                  <th className="px-2 py-3 font-medium">Đánh giá</th>
                  <th className="px-2 py-3 font-medium">Yêu thích</th>
                  <th className="px-2 py-3 font-medium">Ngày tạo</th>
                  <th className="px-2 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-3 font-medium text-slate-800">{user.fullName}</td>
                    <td className="px-2 py-3">{user.email}</td>
                    <td className="px-2 py-3 text-slate-600">{user.phone || "-"}</td>
                    <td className="px-2 py-3">
                      <Badge variant="outline">{adminLabels.userRole[user.role]}</Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>
                        {adminLabels.userStatus[user.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">{user._count.bookings}</td>
                    <td className="px-2 py-3">{user._count.reviews}</td>
                    <td className="px-2 py-3">{user._count.favorites}</td>
                    <td className="px-2 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="px-2 py-3">
                      <div className="space-y-2">
                        <AdminUserActions userId={user.id} role={user.role} status={user.status} />
                        <AdminUserDetailDialog user={user} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} người dùng
            </p>
            <div className="flex gap-2">
              {data.page > 1 ? (
                <Link
                  href={{
                    pathname: "/admin/users",
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
                <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
                  Trang trước
                </span>
              )}
              {data.page < data.totalPages ? (
                <Link
                  href={{
                    pathname: "/admin/users",
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
                <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
                  Trang sau
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Không có người dùng phù hợp"
          description="Hãy thử từ khóa khác để tìm kiếm."
          ctaHref="/admin/users"
          ctaLabel="Xóa bộ lọc"
        />
      )}

      <MobileQuickActions
        items={[
          { href: "#bo-loc-nguoi-dung", label: "Bộ lọc" },
          { href: "#danh-sach-nguoi-dung", label: "Danh sách", active: true },
          { href: "/admin/tours", label: "Tour" },
        ]}
      />
    </div>
  );
}
