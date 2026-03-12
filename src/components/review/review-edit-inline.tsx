"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PencilLine, Star, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { reviewSchema } from "@/lib/validations/tour-interactions";

type ReviewEditInlineProps = {
  tourId: string;
  initialRating: number;
  initialComment: string;
  className?: string;
};

type ReviewEditResponse = {
  message?: string;
};

export function ReviewEditInline({ tourId, initialRating, initialComment, className }: ReviewEditInlineProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
  }, [initialComment, initialRating]);

  const handleCancel = () => {
    setRating(initialRating);
    setComment(initialComment);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    const parsed = reviewSchema.safeParse({
      tourId,
      rating,
      comment,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      toast.error(firstIssue?.message ?? "Dữ liệu đánh giá không hợp lệ.");
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json()) as ReviewEditResponse;

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật đánh giá lúc này.");
        return;
      }

      toast.success(payload.message ?? "Đánh giá của bạn đã được cập nhật.");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Không thể cập nhật đánh giá lúc này.");
    } finally {
      setIsPending(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={
          className ??
          "inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        }
      >
        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
        Sửa đánh giá
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              disabled={isPending}
              className="rounded-md p-1 transition-colors hover:bg-white disabled:cursor-not-allowed"
              aria-label={`Chọn ${value} sao`}
            >
              <Star
                className={cn("h-4 w-4", value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
              />
            </button>
          );
        })}
        <span className="ml-1 text-xs font-medium text-slate-500">{rating}/5</span>
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        disabled={isPending}
        placeholder="Chia sẻ trải nghiệm thực tế của bạn..."
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:opacity-70"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="iv-btn-primary inline-flex h-9 items-center justify-center px-3 text-xs font-semibold disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu đánh giá"
          )}
        </button>
      </div>
    </div>
  );
}
