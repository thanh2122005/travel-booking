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
  tour?: {
    title: string;
    slug: string;
  } | null;
};

type AdminInquiriesTableProps = {
  items: InquiryItem[];
};

const inquiryStatusOptions: Array<{ value: InquiryStatusValue; label: string }> = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "RESOLVED", label: "Đã xử lý" },
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
      toast.error("Vui lòng chọn ít nhất một yêu cầu để cập nhật.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/inquiries/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIdsInPage,
          status: bulkStatus,
        }),
      });

      const payload = (await response.json()) as { message?: string; count?: number };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật yêu cầu tư vấn hàng loạt.");
        return;
      }

      setSelectedIds([]);
      toast.success(payload.message ?? "Đã cập nhật yêu cầu tư vấn hàng loạt.");
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
              Đã chọn <span className="font-semibold text-slate-900">{selectedIdsInPage.length}</span> yêu cầu
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
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value as InquiryStatusValue)}
            className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
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

      <div className="iv-card overflow-x-auto p-4">
        <table className="w-full min-w-[1100px] text-left text-sm">
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
              <th className="px-2 py-3 font-medium">Mã</th>
              <th className="px-2 py-3 font-medium">Khách hàng</th>
              <th className="px-2 py-3 font-medium">Liên hệ</th>
              <th className="px-2 py-3 font-medium">Chi tiết</th>
              <th className="px-2 py-3 font-medium">Nội dung</th>
              <th className="px-2 py-3 font-medium">Ngày gửi</th>
              <th className="px-2 py-3 font-medium">Trạng thái</th>
              <th className="px-2 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((inquiry) => (
              <tr key={inquiry.id} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={selectedIdsInPage.includes(inquiry.id)}
                    onChange={(event) => toggleItem(inquiry.id, event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
                  />
                </td>
                <td className="px-2 py-3 font-mono text-xs text-slate-700">{inquiry.referenceCode}</td>
                <td className="px-2 py-3 font-medium text-slate-900">{inquiry.fullName}</td>
                <td className="px-2 py-3">
                  <p className="text-slate-800">{inquiry.phone}</p>
                  <p className="text-xs text-slate-500">{inquiry.email}</p>
                </td>
                <td className="px-2 py-3 text-xs text-slate-600">
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
                  <p className="mt-1">{inquiry.numberOfGuests} khách</p>
                  {inquiry.departureDate ? <p className="mt-1">Khởi hành: {formatDate(new Date(inquiry.departureDate))}</p> : null}
                </td>
                <td className="px-2 py-3">
                  <p className="line-clamp-3 text-xs text-slate-700">{inquiry.message || "Không có nội dung"}</p>
                </td>
                <td className="px-2 py-3 text-xs text-slate-500">{formatDate(new Date(inquiry.createdAt))}</td>
                <td className="px-2 py-3">
                  {inquiry.status === "RESOLVED" ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Đã xử lý
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      Chờ xử lý
                    </span>
                  )}
                </td>
                <td className="px-2 py-3 text-right">
                  <AdminInquiryActions inquiryId={inquiry.id} status={inquiry.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
