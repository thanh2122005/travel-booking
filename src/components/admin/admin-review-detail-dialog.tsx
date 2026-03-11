"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AdminReviewDetailDialogProps = {
  review: {
    id: string;
    rating: number;
    comment: string;
    isVisible: boolean;
    user: {
      fullName: string;
    };
    tour: {
      title: string;
    };
  };
};

export function AdminReviewDetailDialog({ review }: AdminReviewDetailDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(String(review.rating));
  const [comment, setComment] = useState(review.comment);
  const [isVisible, setIsVisible] = useState(review.isVisible);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      toast.error("Rating phải từ 1 đến 5.");
      return;
    }
    if (!comment.trim().length) {
      toast.error("Nội dung đánh giá là bắt buộc.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/reviews/${review.id}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: Math.trunc(parsedRating),
          comment: comment.trim(),
          isVisible,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật review.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật review.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
        Sửa review
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa review</DialogTitle>
          <DialogDescription>
            {review.user.fullName} · {review.tour.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[120px_1fr]">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Rating</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <label className="inline-flex items-end gap-2 pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(event) => setIsVisible(event.target.checked)}
              />
              Hiển thị review này trên website
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Nội dung</label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang lưu
              </>
            ) : (
              "Lưu review"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
