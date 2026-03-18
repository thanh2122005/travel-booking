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
  { value: "USER", label: "NgÆ°á»i dÃ¹ng" },
  { value: "ADMIN", label: "Quáº£n trá»‹ viÃªn" },
];

const statusOptions: Array<{ value: UserStatusValue; label: string }> = [
  { value: "ACTIVE", label: "Hoáº¡t Ä‘á»™ng" },
  { value: "BLOCKED", label: "Bá»‹ khÃ³a" },
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
      toast.error("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t ngÆ°á»i dÃ¹ng Ä‘á»ƒ cáº­p nháº­t.");
      return;
    }

    if (!bulkRole && !bulkStatus) {
      toast.error("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t trÆ°á»ng cáº§n cáº­p nháº­t hÃ ng loáº¡t.");
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

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "KhÃ´ng thá»ƒ cáº­p nháº­t ngÆ°á»i dÃ¹ng hÃ ng loáº¡t.");
        return;
      }

      setSelectedIds([]);
      setBulkRole("");
      setBulkStatus("");
      toast.success(payload.message ?? "ÄÃ£ cáº­p nháº­t ngÆ°á»i dÃ¹ng hÃ ng loáº¡t.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-admin-bulk-card">
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0 max-w-2xl">
              <p className="iv-admin-bulk-heading">Cáº­p nháº­t hÃ ng loáº¡t</p>
              <p className="iv-admin-bulk-meta">
                ÄÃ£ chá»n <span className="font-semibold text-slate-800">{selectedIdsInPage.length}</span> ngÆ°á»i dÃ¹ng trong trang hiá»‡n táº¡i.
              </p>
            </div>
            {selectedIdsInPage.length ? (
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Bá» chá»n trong trang
              </button>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              Chá»n táº¥t cáº£ trong trang
            </label>

            <select
              value={bulkRole}
              onChange={(event) => setBulkRole(event.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">KhÃ´ng Ä‘á»•i vai trÃ²</option>
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
              <option value="">KhÃ´ng Ä‘á»•i tráº¡ng thÃ¡i</option>
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
                  Äang cáº­p nháº­t...
                </>
              ) : (
                "Ãp dá»¥ng cho cÃ¡c dÃ²ng Ä‘Ã£ chá»n"
              )}
            </button>
          </div>
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
                    <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>{statusLabels[user.status]}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">SÄT: {user.phone || "-"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{roleLabels[user.role]}</Badge>
                  <Badge variant="outline">ÄÆ¡n: {user._count.bookings}</Badge>
                  <Badge variant="outline">ÄÃ¡nh giÃ¡: {user._count.reviews}</Badge>
                  <Badge variant="outline">YÃªu thÃ­ch: {user._count.favorites}</Badge>
                </div>
                <p className="mt-3 text-xs text-slate-500">NgÃ y táº¡o: {formatDate(new Date(user.createdAt))}</p>
                <div className="mt-3 space-y-2">
                  <AdminUserActions userId={user.id} role={user.role} status={user.status} />
                  <AdminUserDetailDialog user={user} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="iv-card hidden lg:block">
        <div className="iv-admin-table-scroll">
          <table className="min-w-[700px] w-full text-sm">
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
                <th className="px-2 py-3 font-medium whitespace-nowrap">NgÆ°á»i dÃ¹ng</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">PhÃ¢n quyá»n</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Hoáº¡t Ä‘á»™ng</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">NgÃ y táº¡o</th>
                <th className="iv-admin-table-sticky-actions-head px-2 py-3 font-medium whitespace-nowrap text-right">Thao tÃ¡c</th>
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
                  <td className="px-2 py-3 min-w-[200px]">
                    <p className="font-medium text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">SÄT: {user.phone || "-"}</p>
                  </td>
                  <td className="px-2 py-3 min-w-[150px]">
                    <div className="space-y-2">
                      <Badge variant="outline">{roleLabels[user.role]}</Badge>
                      <div>
                        <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>{statusLabels[user.status]}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 min-w-[150px]">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">ÄÆ¡n {user._count.bookings}</span>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">ÄÃ¡nh giÃ¡ {user._count.reviews}</span>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">YÃªu thÃ­ch {user._count.favorites}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-slate-500 whitespace-nowrap">{formatDate(new Date(user.createdAt))}</td>
                  <td className="iv-admin-table-sticky-actions-cell px-2 py-3 border-l border-slate-100">
                    <div className="ml-auto flex min-w-[160px] flex-col items-end gap-2">
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





