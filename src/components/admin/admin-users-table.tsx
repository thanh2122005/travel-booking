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
      if (checked) {
        return Array.from(new Set([...prev, ...itemIds]));
      }
      return prev.filter((id) => !itemIds.includes(id));
    });
  }

  function toggleItem(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
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
      const response = await fetch("/api/admin/users/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIdsInPage,
          ...(bulkRole ? { role: bulkRole } : {}),
          ...(bulkStatus ? { status: bulkStatus } : {}),
        }),
      });

      const payload = (await response.json()) as { message?: string; count?: number };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật người dùng hàng loạt.");
        return;
      }

      setSelectedIds([]);
      setBulkRole("");
      setBulkStatus("");
      toast.success(payload.message ?? "Đã cập nhật người dùng hàng loạt.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Cập nhật hàng loạt
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Đã chọn <span className="font-semibold text-slate-900">{selectedIdsInPage.length}</span> người dùng
              trong trang hiện tại.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(event) => toggleSelectAll(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-teal-600"
            />
            Chọn tất cả trong trang
          </label>

          {selectedIdsInPage.length ? (
            <button
              type="button"
              onClick={() => toggleSelectAll(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Bỏ chọn trong trang
            </button>
          ) : null}

          <select
            value={bulkRole}
            onChange={(event) => setBulkRole(event.target.value)}
            className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
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
            className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
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
            className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
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

      <div className="space-y-3 lg:hidden">
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
                    <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>
                    {statusLabels[user.status]}
                  </Badge>
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

      <div className="iv-card hidden overflow-x-auto p-4 lg:block">
        <table className="w-full min-w-[1020px] text-sm">
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
            {items.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={selectedIdsInPage.includes(user.id)}
                    onChange={(event) => toggleItem(user.id, event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
                  />
                </td>
                <td className="px-2 py-3 font-medium text-slate-800">{user.fullName}</td>
                <td className="px-2 py-3">{user.email}</td>
                <td className="px-2 py-3 text-slate-600">{user.phone || "-"}</td>
                <td className="px-2 py-3">
                  <Badge variant="outline">{roleLabels[user.role]}</Badge>
                </td>
                <td className="px-2 py-3">
                  <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>
                    {statusLabels[user.status]}
                  </Badge>
                </td>
                <td className="px-2 py-3">{user._count.bookings}</td>
                <td className="px-2 py-3">{user._count.reviews}</td>
                <td className="px-2 py-3">{user._count.favorites}</td>
                <td className="px-2 py-3 text-slate-500">{formatDate(new Date(user.createdAt))}</td>
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
    </div>
  );
}
