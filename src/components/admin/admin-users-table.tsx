"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { AdminUserDetailDialog } from "@/components/admin/admin-user-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

type UserRoleValue = "ADMIN" | "USER";
type UserStatusValue = "ACTIVE" | "BLOCKED";

type UserItem = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRoleValue;
  status: UserStatusValue;
  createdAt: Date | string;
  _count: {
    bookings: number;
    reviews: number;
    favorites: number;
  };
};

type AdminUsersTableProps = {
  items: UserItem[];
  roleLabels: Record<UserRoleValue, string>;
  statusLabels: Record<UserStatusValue, string>;
};

const roleOptions: Array<{ value: UserRoleValue; label: string }> = [
  { value: "USER", label: "Người dùng" },
  { value: "ADMIN", label: "Quản trị viên" },
];

const statusOptions: Array<{ value: UserStatusValue; label: string }> = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "BLOCKED", label: "Bị khóa" },
];

export function AdminUsersTable({ items, roleLabels, statusLabels }: AdminUsersTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const selectedIdsInPage = useMemo(
    () => selectedIds.filter((id) => itemIds.includes(id)),
    [itemIds, selectedIds],
  );
  const isAllSelected = itemIds.length > 0 && selectedIdsInPage.length === itemIds.length;

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...itemIds]));
      return prev.filter((id) => !itemIds.includes(id));
    });
  }

  function toggleItem(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  }

  function handleBulkUpdate() {
    if (!selectedIdsInPage.length) {
      toast.error("Vui lòng chọn ít nhất một người dùng để cập nhật.");
      return;
    }

    if (!bulkRole && !bulkStatus) {
      toast.error("Vui lòng chọn ít nhất một trường cần cập nhật hàng loạt.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/users/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: selectedIdsInPage,
            ...(bulkRole ? { role: bulkRole } : {}),
            ...(bulkStatus ? { status: bulkStatus } : {}),
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          toast.error(payload.message ?? "Không thể cập nhật người dùng hàng loạt.");
          return;
        }

        setSelectedIds([]);
        setBulkRole("");
        setBulkStatus("");
        toast.success(payload.message ?? "Đã cập nhật người dùng hàng loạt.");
        router.refresh();
      } catch {
        toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-admin-bulk-card">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="iv-admin-bulk-heading">Cập nhật hàng loạt</p>
              <p className="iv-admin-bulk-meta">
                Đã chọn <span className="font-semibold text-slate-800">{selectedIdsInPage.length}</span> người dùng trong trang hiện tại.
              </p>
            </div>
            {selectedIdsInPage.length ? (
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Bỏ chọn trong trang
              </button>
            ) : null}
          </div>

          <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-5">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:col-span-2 xl:col-span-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              Chọn tất cả trong trang
            </label>

            <select
              value={bulkRole}
              onChange={(event) => setBulkRole(event.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Không đổi vai trò</option>
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Không đổi trạng thái</option>
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleBulkUpdate}
              disabled={isPending}
              className="iv-btn-primary inline-flex h-10 w-full items-center justify-center px-5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2 xl:col-span-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Áp dụng cho các dòng đã chọn"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 xl:hidden">
        {items.map((user) => (
          <article key={user.id} className="iv-card p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIdsInPage.includes(user.id)}
                onChange={(event) => toggleItem(user.id, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>{statusLabels[user.status]}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">SĐT: {user.phone || "-"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{roleLabels[user.role]}</Badge>
                  <Badge variant="outline">Đơn: {user._count.bookings}</Badge>
                  <Badge variant="outline">Đánh giá: {user._count.reviews}</Badge>
                  <Badge variant="outline">Yêu thích: {user._count.favorites}</Badge>
                </div>
                <p className="mt-3 text-xs text-slate-500">Ngày tạo: {formatDate(new Date(user.createdAt))}</p>
                <div className="mt-3 space-y-2">
                  <AdminUserActions userId={user.id} role={user.role} status={user.status} />
                  <AdminUserDetailDialog user={user} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="iv-card hidden xl:block">
        <div className="iv-admin-table-scroll">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                  />
                </th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Người dùng</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Phân quyền</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Hoạt động</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Ngày tạo</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIdsInPage.includes(user.id)}
                      onChange={(event) => toggleItem(user.id, event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
                    />
                  </td>
                  <td className="min-w-[190px] px-2 py-3">
                    <p className="font-medium text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">SĐT: {user.phone || "-"}</p>
                  </td>
                  <td className="min-w-[140px] px-2 py-3">
                    <div className="space-y-2">
                      <Badge variant="outline">{roleLabels[user.role]}</Badge>
                      <div>
                        <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>{statusLabels[user.status]}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="min-w-[150px] px-2 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Đơn {user._count.bookings}</span>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Đánh giá {user._count.reviews}</span>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Yêu thích {user._count.favorites}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-slate-500">{formatDate(new Date(user.createdAt))}</td>
                  <td className="min-w-[232px] px-2 py-3">
                    <div className="ml-auto flex w-full max-w-[216px] flex-col items-end gap-2">
                      <AdminUserActions userId={user.id} role={user.role} status={user.status} compact />
                      <AdminUserDetailDialog user={user} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
