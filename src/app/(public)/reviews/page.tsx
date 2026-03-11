import Image from "next/image";
import Link from "next/link";
import { MessageSquareText, Star } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getPublicReviews } from "@/lib/db/public-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type ReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ReviewSortValue = "newest" | "rating-desc" | "rating-asc";

const fallbackAvatar = [
  "/immerse-vietnam/images/test-1.jpg",
  "/immerse-vietnam/images/test-2.jpg",
  "/immerse-vietnam/images/test-3.jpg",
];

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseSort(value: string): ReviewSortValue {
  if (value === "rating-desc" || value === "rating-asc") {
    return value;
  }
  return "newest";
}

function parseRating(value: string) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  const normalized = Math.trunc(rating);
  return normalized >= 1 && normalized <= 5 ? normalized : 0;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const minRating = parseRating(normalizeParam(params.minRating));
  const sort = parseSort(normalizeParam(params.sort));
  const hasActiveFilters = Boolean(search || minRating || sort !== "newest");
  const normalizedSearch = search.trim().toLowerCase();

  const data = await getPublicReviews(60).catch(() => ({
    reviews: [],
    summary: {
      total: 0,
      avgRating: 0,
      byRating: {} as Record<number, number>,
    },
  }));
  const byRating = data.summary.byRating as Record<number, number>;
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = byRating[rating] ?? 0;
    const percent = data.summary.total ? (count / data.summary.total) * 100 : 0;
    return { rating, count, percent };
  });

  const filteredReviews = data.reviews
    .filter((review) => {
      const searchMatched =
        !normalizedSearch ||
        review.comment.toLowerCase().includes(normalizedSearch) ||
        review.user.fullName.toLowerCase().includes(normalizedSearch) ||
        review.tour.title.toLowerCase().includes(normalizedSearch) ||
        review.tour.location.name.toLowerCase().includes(normalizedSearch);
      const ratingMatched = !minRating || review.rating >= minRating;
      return searchMatched && ratingMatched;
    })
    .slice()
    .sort((a, b) => {
      if (sort === "rating-desc") return b.rating - a.rating;
      if (sort === "rating-asc") return a.rating - b.rating;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });

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
          description={`Hiển thị ${filteredReviews.length}/${data.reviews.length} đánh giá theo bộ lọc hiện tại.`}
        />

        <article className="iv-card p-4">
          <p className="text-sm font-semibold text-slate-900">Phân bố điểm đánh giá</p>
          <div className="mt-3 space-y-2">
            {ratingDistribution.map((row) => (
              <div key={row.rating} className="flex items-center gap-2 text-xs">
                <span className="w-10 font-medium text-slate-700">{row.rating} sao</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.max(row.percent, row.count ? 5 : 0)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-500">{row.count}</span>
              </div>
            ))}
          </div>
        </article>

        <form className="iv-card p-4">
          <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Tìm kiếm đánh giá
          </label>
          <div className="grid gap-2 md:grid-cols-[1fr_180px_180px_auto_auto]">
            <input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Nội dung đánh giá, tên người dùng hoặc tour..."
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
            <select
              name="minRating"
              defaultValue={minRating || ""}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Tất cả mức điểm</option>
              <option value="5">Từ 5 sao</option>
              <option value="4">Từ 4 sao</option>
              <option value="3">Từ 3 sao</option>
              <option value="2">Từ 2 sao</option>
              <option value="1">Từ 1 sao</option>
            </select>
            <select
              name="sort"
              defaultValue={sort}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="rating-desc">Điểm cao đến thấp</option>
              <option value="rating-asc">Điểm thấp đến cao</option>
            </select>
            <button
              type="submit"
              className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
            >
              Áp dụng
            </button>
            {hasActiveFilters ? (
              <Link
                href="/reviews"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>
        </form>

        {filteredReviews.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredReviews.map((review, index) => (
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
        ) : data.reviews.length ? (
          <EmptyState
            title="Không có đánh giá phù hợp"
            description="Hãy thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem toàn bộ đánh giá."
            ctaHref="/reviews"
            ctaLabel="Xóa bộ lọc"
          />
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
