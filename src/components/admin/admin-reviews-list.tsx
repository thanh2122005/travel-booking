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

      const payload = (await response.json()) as { message?: string; count?: number };
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
      <div className="iv-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Cập nhật hiển thị hàng loạt
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Đã chọn <span className="font-semibold text-slate-900">{selectedIdsInPage.length}</span>{" "}
              đánh giá.
            </p>
          </div>
          <select
            value={bulkVisible}
            onChange={(event) => setBulkVisible(event.target.value)}
            className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="visible">Hiển thị</option>
            <option value="hidden">Ẩn</option>
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

      <div className="space-y-3">
        {items.map((review) => (
          <article key={review.id} className="iv-card p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIdsInPage.includes(review.id)}
                onChange={(event) => toggleItem(review.id, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{review.user.fullName}</p>
                    <p className="text-xs text-slate-500">{review.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{review.rating}/5</Badge>
                    <Badge variant={review.isVisible ? "default" : "secondary"}>
                      {review.isVisible ? "Đang hiển thị" : "Ẩn"}
                    </Badge>
                    <span className="text-xs text-slate-500">{formatDate(new Date(review.createdAt))}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{review.comment}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Tour:{" "}
                  <Link href={`/tours/${review.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                    {review.tour.title}
                  </Link>
                </p>
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminReviewActions reviewId={review.id} isVisible={review.isVisible} />
                    <AdminReviewDetailDialog review={review} />
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(event) => toggleSelectAll(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-teal-600"
          />
          Chọn tất cả đánh giá trong trang hiện tại
        </label>
      </div>
    </div>
  );
}
