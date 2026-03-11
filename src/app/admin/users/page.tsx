import Link from "next/link";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { AdminUserDetailDialog } from "@/components/admin/admin-user-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { adminLabels, getAdminUsers } from "@/lib/db/admin-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const role = normalizeParam(params.role);
  const status = normalizeParam(params.status);
  const page = Number(normalizeParam(params.page) || "1");

  const data = await getAdminUsers({
    search: search || undefined,
    role: role ? (role as "ADMIN" | "USER") : undefined,
    status: status ? (status as "ACTIVE" | "BLOCKED") : undefined,
    page: Number.isFinite(page) ? page : 1,
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
    <div className="space-y-5">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi tài khoản, vai trò, trạng thái và mức độ hoạt động.</p>
      </div>

      <form className="iv-card p-4">
        <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm kiếm người dùng
        </label>
        <div className="grid gap-2 lg:grid-cols-[1fr_180px_180px_auto]">
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
              <Link
                href={{
                  pathname: "/admin/users",
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
                  pathname: "/admin/users",
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
          title="Không có người dùng phù hợp"
          description="Hãy thử từ khóa khác để tìm kiếm."
          ctaHref="/admin/users"
          ctaLabel="Xóa bộ lọc"
        />
      )}
    </div>
  );
}
