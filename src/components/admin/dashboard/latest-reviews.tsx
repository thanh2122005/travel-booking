import Link from "next/link";
import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import type { DashboardRecentReview } from "@/components/admin/dashboard/types";

type LatestReviewsProps = {
  items: DashboardRecentReview[];
};

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => {
    const active = index < rating;
    return <Star key={index} className={`h-3.5 w-3.5 ${active ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />;
  });
}

export function LatestReviews({ items }: LatestReviewsProps) {
  return (
    <article className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-600">Đánh giá mới nhất</h3>
        <Link href="/admin/reviews" className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">
          Xem tất cả
        </Link>
      </div>

      {items.length ? (
        <div className="space-y-2.5">
          {items.slice(0, 7).map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-600">{review.user.fullName}</p>
                <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
              </div>

              <div className="mt-1 flex items-center gap-1">{renderStars(review.rating)}</div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{review.comment}</p>
              <Link href={`/tours/${review.tour.slug}`} className="mt-1 block text-xs text-cyan-700 hover:text-cyan-800">
                {review.tour.title}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          Chưa có đánh giá mới.
        </p>
      )}
    </article>
  );
}


