"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminReviewActions } from "@/components/admin/admin-review-actions";
import { AdminReviewDetailDialog } from "@/components/admin/admin-review-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: Date | string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  tour: {
    id: string;
    title: string;
    slug: string;
  };
};

type AdminReviewsListProps = {
  items: ReviewItem[];
};

export function AdminReviewsList({ items }: AdminReviewsListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkVisible, setBulkVisible] = useState("visible");
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
      toast.error("Vui lòng chọn ít nhất một đánh giá để cập nhật.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/reviews/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIdsInPage,
          isVisible: bulkVisible === "visible",
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật đánh giá hàng loạt.");
        return;
      }

      setSelectedIds([]);
      toast.success(payload.message ?? "Đã cập nhật đánh giá hàng loạt.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-admin-bulk-card">
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0 max-w-2xl">
              <p className="iv-admin-bulk-heading">Cập nhật hiển thị hàng loạt</p>
              <p className="iv-admin-bulk-meta">
                Đã chọn <span className="font-semibold text-slate-800">{selectedIdsInPage.length}</span> đánh giá trong trang hiện tại.
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

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:col-span-2 xl:col-span-1">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              Chọn tất cả trong trang
            </label>
            <select
              value={bulkVisible}
              onChange={(event) => setBulkVisible(event.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="visible">Hiển thị</option>
              <option value="hidden">Ẩn</option>
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
                  Đang cập nhật...
                </>
              ) : (
                "Áp dụng cho các dòng đã chọn"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((review) => (
          <article key={review.id} className="iv-card p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIdsInPage.includes(review.id)}
                onChange={(event) => toggleItem(review.id, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{review.user.fullName}</p>
                    <p className="text-xs text-slate-500">{review.user.email}</p>
                  </div>
                  <Badge variant="outline">{review.rating}/5</Badge>
                </div>

                <p className="line-clamp-3 text-sm text-slate-700">{review.comment}</p>
                <p className="text-xs text-slate-500">
                  Tour:{" "}
                  <Link href={`/tours/${review.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                    {review.tour.title}
                  </Link>
                </p>
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                  <Badge variant={review.isVisible ? "default" : "secondary"}>
                    {review.isVisible ? "Đang hiển thị" : "Ẩn"}
                  </Badge>
                  <span className="text-xs text-slate-500">{formatDate(new Date(review.createdAt))}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminReviewActions reviewId={review.id} isVisible={review.isVisible} />
                  <AdminReviewDetailDialog review={review} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="iv-card hidden lg:block">
        <div className="iv-admin-table-scroll">
          <table className="min-w-[820px] w-full text-sm">
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
                <th className="px-2 py-3 font-medium whitespace-nowrap">Tour</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Đánh giá</th>
                <th className="px-2 py-3 font-medium">Bình luận</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Ngày tạo</th>
                <th className="iv-admin-table-sticky-actions-head px-2 py-3 font-medium whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((review) => (
                <tr key={review.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-2 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIdsInPage.includes(review.id)}
                      onChange={(event) => toggleItem(review.id, event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
                    />
                  </td>
                  <td className="px-2 py-3 min-w-[180px]">
                    <p className="font-medium text-slate-800">{review.user.fullName}</p>
                    <p className="text-xs text-slate-500">{review.user.email}</p>
                  </td>
                  <td className="px-2 py-3 min-w-[170px]">
                    <Link href={`/tours/${review.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                      {review.tour.title}
                    </Link>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{review.rating}/5</Badge>
                      <Badge variant={review.isVisible ? "default" : "secondary"}>
                        {review.isVisible ? "Đang hiển thị" : "Ẩn"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-2 py-3 min-w-[220px]">
                    <p className="line-clamp-2 text-sm text-slate-700">{review.comment}</p>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(new Date(review.createdAt))}</td>
                  <td className="iv-admin-table-sticky-actions-cell px-2 py-3 border-l border-slate-100">
                    <div className="ml-auto flex w-fit min-w-[160px] flex-col items-end gap-2">
                      <AdminReviewActions reviewId={review.id} isVisible={review.isVisible} compact />
                      <AdminReviewDetailDialog review={review} />
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




