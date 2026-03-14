"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";

type NewsletterItem = {
  id: string;
  email: string;
  createdAt: Date | string;
};

type AdminNewsletterTableProps = {
  items: NewsletterItem[];
};

export function AdminNewsletterTable({ items }: AdminNewsletterTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  function handleBulkDelete() {
    if (!selectedIdsInPage.length) {
      toast.error("Vui lòng chọn ít nhất một email để xóa.");
      return;
    }

    if (!window.confirm(`Xóa ${selectedIdsInPage.length} email đã chọn khỏi danh sách nhận tin?`)) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/newsletter/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIdsInPage }),
      });

      const payload = (await response.json()) as { message?: string; count?: number };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể xóa đăng ký nhận tin hàng loạt.");
        return;
      }

      setSelectedIds([]);
      toast.success(payload.message ?? "Đã xóa email đăng ký nhận tin.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Thao tác hàng loạt</p>
            <p className="mt-1 text-sm text-slate-600">
              Đã chọn <span className="font-semibold text-slate-900">{selectedIdsInPage.length}</span> email
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

          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Xóa các email đã chọn
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((subscriber) => (
          <article key={subscriber.id} className="iv-card p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIdsInPage.includes(subscriber.id)}
                onChange={(event) => toggleItem(subscriber.id, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{subscriber.email}</p>
                <p className="mt-1 text-xs text-slate-500">Đăng ký: {formatDate(new Date(subscriber.createdAt))}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="iv-card hidden overflow-x-auto p-4 lg:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-2 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                />
              </th>
              <th className="px-2 py-3 font-medium">Email</th>
              <th className="px-2 py-3 font-medium">Ngày đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {items.map((subscriber) => (
              <tr key={subscriber.id} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={selectedIdsInPage.includes(subscriber.id)}
                    onChange={(event) => toggleItem(subscriber.id, event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
                  />
                </td>
                <td className="px-2 py-3 font-medium text-slate-900">{subscriber.email}</td>
                <td className="px-2 py-3 text-slate-500">{formatDate(new Date(subscriber.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
