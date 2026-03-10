import Image from "next/image";
import Link from "next/link";
import { MessageSquareText, Star } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getPublicReviews } from "@/lib/db/public-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const fallbackAvatar = [
  "/immerse-vietnam/images/test-1.jpg",
  "/immerse-vietnam/images/test-2.jpg",
  "/immerse-vietnam/images/test-3.jpg",
];

export default async function ReviewsPage() {
  const data = await getPublicReviews(30).catch(() => ({
    reviews: [],
    summary: {
      total: 0,
      avgRating: 0,
      byRating: {},
    },
  }));

  return (
    <div className="space-y-8">
      <div className="iv-card overflow-hidden bg-[linear-gradient(130deg,#091f33,#0b344f,#0f706d)] p-7 text-white md:p-9">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
          <MessageSquareText className="h-4 w-4" />
          Đánh giá thực tế
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Đánh giá từ khách hàng</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          Tổng hợp đánh giá thực tế từ người đã có booking hợp lệ. Data lấy trực tiếp từ model Review.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2">
            <p className="text-xs uppercase tracking-[0.14em] text-teal-100">Tổng review</p>
            <p className="text-xl font-bold">{data.summary.total}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2">
            <p className="text-xs uppercase tracking-[0.14em] text-teal-100">Điểm trung bình</p>
            <p className="text-xl font-bold">{data.summary.avgRating}/5</p>
          </div>
        </div>
      </div>

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Phản hồi cộng đồng"
          title="Trải nghiệm được xác thực"
          description="Chỉ review visible và có booking hợp lệ mới hiển thị trong hệ thống."
        />

        {data.reviews.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.reviews.map((review, index) => (
              <article key={review.id} className="iv-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 overflow-hidden rounded-full border border-slate-200">
                      <Image
                        src={review.user.avatarUrl || fallbackAvatar[index % fallbackAvatar.length]}
                        alt={review.user.fullName}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{review.user.fullName}</p>
                      <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    {review.rating}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Tour:{" "}
                  <Link href={`/tours/${review.tour.slug}`} className="font-semibold text-teal-700 hover:text-teal-800">
                    {review.tour.title}
                  </Link>{" "}
                  · {review.tour.location.name}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có review hiển thị"
            description="Hiện tại chưa có đánh giá nào đủ điều kiện hiển thị."
            ctaHref="/tours"
            ctaLabel="Xem danh sách tour"
          />
        )}
      </section>
    </div>
  );
}
