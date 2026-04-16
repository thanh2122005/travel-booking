"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildCallbackUrl } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";
import { reviewSchema } from "@/lib/validations/tour-interactions";

type InitialReview = {
  rating: number;
  comment: string;
} | null;

type TourReviewFormProps = {
  tourId: string;
  tourSlug: string;
  initialReview: InitialReview;
};

export function TourReviewForm({ tourId, tourSlug, initialReview }: TourReviewFormProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLoggedIn = Boolean(session?.user);

  const callbackUrl = buildCallbackUrl(
    pathname || `/tours/${tourSlug}`,
    searchParams.toString() ? `?${searchParams.toString()}` : "",
  );
  const loginHref = `/dang-nhap?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const [reviewRating, setReviewRating] = useState(initialReview?.rating ?? 5);
  const [reviewComment, setReviewComment] = useState(initialReview?.comment ?? "");
  const [hasExistingReview, setHasExistingReview] = useState(Boolean(initialReview));
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  async function handleSubmitReview() {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để đánh giá.");
      return;
    }

    const parsed = reviewSchema.safeParse({
      tourId,
      rating: reviewRating,
      comment: reviewComment,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      toast.error(firstIssue?.message ?? "Dữ liệu đánh giá không hợp lệ.");
      return;
    }

    setIsReviewSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể gửi đánh giá, vui lòng thử lại.");
        return;
      }

      setHasExistingReview(true);
      toast.success(payload.message ?? "Đánh giá của bạn đã được ghi nhận.");
    } catch {
      toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4 md:p-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold">Đánh giá của bạn</p>
        <p className="text-xs text-muted-foreground">
          Chỉ người dùng có đơn đã xác nhận hoặc đã hoàn thành mới có thể gửi đánh giá.
        </p>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setReviewRating(value)}
              className="rounded-md p-1 transition-colors hover:bg-muted disabled:cursor-not-allowed"
              disabled={!isLoggedIn || isReviewSubmitting}
              aria-label={`Chọn ${value} sao`}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  value <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                )}
              />
            </button>
          );
        })}
        <span className="ml-1 text-xs text-muted-foreground">{reviewRating}/5</span>
      </div>

      <Textarea
        rows={4}
        placeholder="Chia sẻ trải nghiệm thực tế của bạn về tour này..."
        value={reviewComment}
        onChange={(event) => setReviewComment(event.target.value)}
        disabled={!isLoggedIn || isReviewSubmitting}
      />

      <Button
        type="button"
        variant="secondary"
        className="h-10"
        onClick={handleSubmitReview}
        disabled={!isLoggedIn || isReviewSubmitting || status === "loading"}
      >
        {isReviewSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang gửi đánh giá...
          </>
        ) : hasExistingReview ? (
          "Cập nhật đánh giá"
        ) : (
          "Gửi đánh giá"
        )}
      </Button>

      {!isLoggedIn && status !== "loading" ? (
        <p className="text-xs text-muted-foreground">
          <Link href={loginHref} className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>{" "}
          để gửi đánh giá cho tour này.
        </p>
      ) : null}
    </div>
  );
}
