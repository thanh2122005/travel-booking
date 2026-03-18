"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminInquiryActions } from "@/components/admin/admin-inquiry-actions";
import { formatDate } from "@/lib/utils/format";

type InquiryStatusValue = "PENDING" | "RESOLVED";

type InquiryItem = {
  id: string;
  referenceCode: string;
  fullName: string;
  email: string;
  phone: string;
  numberOfGuests: number;
  departureDate?: Date | string | null;
  status: InquiryStatusValue;
  message: string;
  createdAt: Date | string;
  tour?: { title: string; slug: string } | null;
};

type AdminInquiriesTableProps = {
  items: InquiryItem[];
};

const inquiryStatusOptions: Array<{ value: InquiryStatusValue; label: string }> = [
  { value: "PENDING", label: "Chá» xá»­ lÃ½" },
  { value: "RESOLVED", label: "ÄÃ£ xá»­ lÃ½" },
];

export function AdminInquiriesTable({ items }: AdminInquiriesTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<InquiryStatusValue>("RESOLVED");
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
      toast.error("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t yÃªu cáº§u Ä‘á»ƒ cáº­p nháº­t.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/inquiries/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIdsInPage, status: bulkStatus }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "KhÃ´ng thá»ƒ cáº­p nháº­t yÃªu cáº§u tÆ° váº¥n hÃ ng loáº¡t.");
        return;
      }

      setSelectedIds([]);
      toast.success(payload.message ?? "ÄÃ£ cáº­p nháº­t yÃªu cáº§u tÆ° váº¥n hÃ ng loáº¡t.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-card border border-teal-100/70 bg-gradient-to-br from-white via-white to-teal-50/40 p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cáº­p nháº­t hÃ ng loáº¡t</p>
              <p className="mt-1 text-sm text-slate-600">
                ÄÃ£ chá»n <span className="font-semibold text-slate-800">{selectedIdsInPage.length}</span> yÃªu cáº§u trong trang hiá»‡n táº¡i.
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

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:col-span-2 xl:col-span-1">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              Chá»n táº¥t cáº£ trong trang
            </label>
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value as InquiryStatusValue)}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            >
              {inquiryStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkUpdate}
              disabled={isPending}
              className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2 xl:col-span-1"
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
        {items.map((inquiry) => (
          <article key={inquiry.id} className="iv-card p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIdsInPage.includes(inquiry.id)}
                onChange={(event) => toggleItem(inquiry.id, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-xs text-slate-600">{inquiry.referenceCode}</p>
                  {inquiry.status === "RESOLVED" ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">ÄÃ£ xá»­ lÃ½</span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Chá» xá»­ lÃ½</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-800">{inquiry.fullName}</p>
                <p className="text-xs text-slate-500">{inquiry.phone} Â· {inquiry.email}</p>
                <p className="text-xs text-slate-600 line-clamp-3">{inquiry.message || "KhÃ´ng cÃ³ ná»™i dung"}</p>
                <p className="text-xs text-slate-500">NgÃ y gá»­i: {formatDate(new Date(inquiry.createdAt))}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{inquiry.numberOfGuests} khÃ¡ch</span>
                  <AdminInquiryActions inquiryId={inquiry.id} status={inquiry.status} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="iv-card hidden lg:block">
        <div className="overflow-x-auto p-4">
          <table className="min-w-[860px] w-full text-left text-sm">
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
                <th className="px-2 py-3 font-medium whitespace-nowrap">MÃ£</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">KhÃ¡ch hÃ ng</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">LiÃªn há»‡</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Chi tiáº¿t</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Ná»™i dung</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">NgÃ y gá»­i</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Tráº¡ng thÃ¡i</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap text-right">Thao tÃ¡c</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-2 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIdsInPage.includes(inquiry.id)}
                      onChange={(event) => toggleItem(inquiry.id, event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
                    />
                  </td>
                  <td className="px-2 py-3 font-mono text-xs text-slate-700">{inquiry.referenceCode}</td>
                  <td className="px-2 py-3 min-w-[170px] font-medium text-slate-800">{inquiry.fullName}</td>
                  <td className="px-2 py-3 min-w-[170px]">
                    <p className="text-slate-800">{inquiry.phone}</p>
                    <p className="text-xs text-slate-500">{inquiry.email}</p>
                  </td>
                  <td className="px-2 py-3 min-w-[180px] text-xs text-slate-600">
                    {inquiry.tour?.slug ? (
                      <p>
                        Tour:{" "}
                        <Link href={`/tours/${inquiry.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                          {inquiry.tour.title}
                        </Link>
                      </p>
                    ) : inquiry.tour?.title ? (
                      <p>Tour: {inquiry.tour.title}</p>
                    ) : (
                      <p>-</p>
                    )}
                    <p className="mt-1">{inquiry.numberOfGuests} khÃ¡ch</p>
                    {inquiry.departureDate ? <p className="mt-1">Khá»Ÿi hÃ nh: {formatDate(new Date(inquiry.departureDate))}</p> : null}
                  </td>
                  <td className="px-2 py-3 min-w-[220px]">
                    <p className="line-clamp-3 text-xs text-slate-700">{inquiry.message || "KhÃ´ng cÃ³ ná»™i dung"}</p>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(new Date(inquiry.createdAt))}</td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    {inquiry.status === "RESOLVED" ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">ÄÃ£ xá»­ lÃ½</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Chá» xá»­ lÃ½</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right border-l border-slate-100">
                    <div className="ml-auto w-fit">
                      <AdminInquiryActions inquiryId={inquiry.id} status={inquiry.status} />
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

