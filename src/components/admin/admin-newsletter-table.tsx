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

  function handleBulkDelete() {
    if (!selectedIdsInPage.length) {
      toast.error("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t email Ä‘á»ƒ xÃ³a.");
      return;
    }

    if (!window.confirm(`XÃ³a ${selectedIdsInPage.length} email Ä‘Ã£ chá»n khá»i danh sÃ¡ch nháº­n tin?`)) return;

    startTransition(async () => {
      const response = await fetch("/api/admin/newsletter/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIdsInPage }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "KhÃ´ng thá»ƒ xÃ³a Ä‘Äƒng kÃ½ nháº­n tin hÃ ng loáº¡t.");
        return;
      }

      setSelectedIds([]);
      toast.success(payload.message ?? "ÄÃ£ xÃ³a email Ä‘Äƒng kÃ½ nháº­n tin.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-admin-bulk-card">
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div>
              <p className="iv-admin-bulk-heading">Thao tÃ¡c hÃ ng loáº¡t</p>
              <p className="iv-admin-bulk-meta">
                ÄÃ£ chá»n <span className="font-semibold text-slate-800">{selectedIdsInPage.length}</span> email trong trang hiá»‡n táº¡i.
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

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              Chá»n táº¥t cáº£ trong trang
            </label>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Äang xÃ³a...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  XÃ³a cÃ¡c email Ä‘Ã£ chá»n
                </>
              )}
            </button>
          </div>
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
                <p className="text-sm font-semibold text-slate-800">{subscriber.email}</p>
                <p className="mt-1 text-xs text-slate-500">ÄÄƒng kÃ½: {formatDate(new Date(subscriber.createdAt))}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="iv-card hidden lg:block">
        <div className="iv-admin-table-scroll">
          <table className="w-full min-w-[700px] text-left text-sm">
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
                <th className="px-2 py-3 font-medium whitespace-nowrap">Email</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">NgÃ y Ä‘Äƒng kÃ½</th>
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
                  <td className="px-2 py-3 font-medium text-slate-800">{subscriber.email}</td>
                  <td className="px-2 py-3 text-slate-500 whitespace-nowrap">{formatDate(new Date(subscriber.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
