import Image from "next/image";
import Link from "next/link";
import { List, ListFilter, MessageSquareText, Star, UserCircle2 } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { getPublicReviews } from "@/lib/db/public-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type ReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ReviewSortValue = "newest" | "rating-desc" | "rating-asc";
type ReviewQueryOverrides = {
  search?: string;
  location?: string;
  minRating?: number;
  sort?: ReviewSortValue;
  page?: number;
};

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

function parsePage(value: string) {
  const page = Number(value);
  if (!Number.isFinite(page)) return 1;
  const normalized = Math.trunc(page);
  return normalized >= 1 ? normalized : 1;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const requestedLocation = normalizeParam(params.location).trim();
  const minRating = parseRating(normalizeParam(params.minRating));
  const sort = parseSort(normalizeParam(params.sort));
  const requestedPage = parsePage(normalizeParam(params.page));
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
  const locationCountMap = data.reviews.reduce<Record<string, number>>((acc, review) => {
    const locationName = review.tour.location.name;
    acc[locationName] = (acc[locationName] ?? 0) + 1;
    return acc;
  }, {});
  const locationOptions = Object.entries(locationCountMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (b.count === a.count) {
        return a.name.localeCompare(b.name, "vi");
      }
      return b.count - a.count;
    });
  const location =
    locationOptions.find((item) => item.name.toLowerCase() === requestedLocation.toLowerCase())?.name ?? "";
  const hasActiveFilters = Boolean(search || location || minRating || sort !== "newest");

  const filteredReviews = data.reviews
    .filter((review) => {
      const searchMatched =
        !normalizedSearch ||
        review.comment.toLowerCase().includes(normalizedSearch) ||
        review.user.fullName.toLowerCase().includes(normalizedSearch) ||
        review.tour.title.toLowerCase().includes(normalizedSearch) ||
        review.tour.location.name.toLowerCase().includes(normalizedSearch);
      const locationMatched = !location || review.tour.location.name === location;
      const ratingMatched = !minRating || review.rating >= minRating;
      return searchMatched && locationMatched && ratingMatched;
    })
    .slice()
    .sort((a, b) => {
      if (sort === "rating-desc") return b.rating - a.rating;
      if (sort === "rating-asc") return a.rating - b.rating;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const pagedReviews = filteredReviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const buildReviewsHref = (overrides: ReviewQueryOverrides = {}) => {
    const nextSearch = overrides.search ?? search;
    const nextLocation = overrides.location ?? location;
    const nextMinRating = overrides.minRating ?? minRating;
    const nextSort = overrides.sort ?? sort;
    const nextPage = overrides.page ?? currentPage;
    const query = new URLSearchParams();

    if (nextSearch) {
      query.set("search", nextSearch);
    }
    if (nextLocation) {
      query.set("location", nextLocation);
    }
    if (nextMinRating) {
      query.set("minRating", String(nextMinRating));
    }
    if (nextSort !== "newest") {
      query.set("sort", nextSort);
    }
    if (nextPage > 1) {
      query.set("page", String(nextPage));
    }

    const serialized = query.toString();
    return serialized ? `/reviews?${serialized}` : "/reviews";
  };
  const buildPageHref = (page: number) => buildReviewsHref({ page });
  const clearFiltersHref = buildReviewsHref({
    search: "",
    location: "",
    minRating: 0,
    sort: "newest",
    page: 1,
  });

  return (
    <div className="space-y-8 pb-24 lg:pb-0">
      <div className="iv-card overflow-hidden bg-[linear-gradient(130deg,#091f33,#0b344f,#0f706d)] p-7 text-white md:p-9">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
          <MessageSquareText className="h-4 w-4" />
          Đánh giá thực tế
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Đánh giá từ khách hàng</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          Tổng hợp phản hồi thực tế từ khách đã trải nghiệm, giúp bạn tham khảo trước khi chọn tour.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2">
            <p className="text-xs uppercase tracking-[0.14em] text-teal-100">Tổng đánh giá</p>
            <p className="text-xl font-bold">{data.summary.total}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2">
            <p className="text-xs uppercase tracking-[0.14em] text-teal-100">Điểm trung bình</p>
            <p className="text-xl font-bold">{data.summary.avgRating}/5</p>
          </div>
        </div>
      </div>

      <section id="danh-gia-cong-dong" className="scroll-mt-24 space-y-5">
        <HomeSectionHeading
          eyebrow="Phản hồi cộng đồng"
          title="Trải nghiệm được xác thực"
          description={`Hiển thị ${pagedReviews.length}/${filteredReviews.length} đánh giá trên trang ${currentPage}/${totalPages}.`}
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

        <div id="bo-loc-danh-gia" className="scroll-mt-24" />
        <form className="iv-card p-4">
          <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Tìm kiếm đánh giá
          </label>
          <div className="grid gap-2 md:grid-cols-[1fr_170px_220px_180px_auto_auto]">
            <input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Nội dung đánh giá, tên người dùng hoặc tour..."
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
            <select
              name="location"
              defaultValue={location}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Tất cả điểm đến</option>
              {locationOptions.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} ({item.count})
                </option>
              ))}
            </select>
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
              Lọc đánh giá
            </button>
            {hasActiveFilters ? (
              <Link
                href={clearFiltersHref}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>
        </form>

        {data.reviews.length ? (
          <div className="space-y-2">
            {locationOptions.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Điểm đến:</p>
                <Link
                  href={buildReviewsHref({ location: "", page: 1 })}
                  className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                    !location
                      ? "border-teal-300 bg-teal-50 text-teal-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Tất cả
                </Link>
                {locationOptions.slice(0, 8).map((item) => (
                  <Link
                    key={item.name}
                    href={buildReviewsHref({ location: item.name, page: 1 })}
                    className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                      location === item.name
                        ? "border-teal-300 bg-teal-50 text-teal-700"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item.name} ({item.count})
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Lọc nhanh điểm:</p>
              <Link
                href={buildReviewsHref({ minRating: 0, page: 1 })}
                className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                  !minRating
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Tất cả
              </Link>
              {[5, 4, 3].map((ratingValue) => (
                <Link
                  key={ratingValue}
                  href={buildReviewsHref({ minRating: ratingValue, page: 1 })}
                  className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                    minRating === ratingValue
                      ? "border-teal-300 bg-teal-50 text-teal-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Từ {ratingValue} sao
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sắp xếp:</p>
              <Link
                href={buildReviewsHref({ sort: "newest", page: 1 })}
                className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                  sort === "newest"
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Mới nhất
              </Link>
              <Link
                href={buildReviewsHref({ sort: "rating-desc", page: 1 })}
                className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                  sort === "rating-desc"
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Điểm cao đến thấp
              </Link>
              <Link
                href={buildReviewsHref({ sort: "rating-asc", page: 1 })}
                className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                  sort === "rating-asc"
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Điểm thấp đến cao
              </Link>
            </div>
          </div>
        ) : null}

        <div id="ket-qua-danh-gia" className="scroll-mt-24" />
        {filteredReviews.length ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedReviews.map((review, index) => (
                <article key={review.id} className="iv-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 overflow-hidden rounded-full border border-slate-200">
                        <Image
                          src={review.user.avatarUrl || fallbackAvatar[((currentPage - 1) * pageSize + index) % fallbackAvatar.length]}
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
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">
                      Tour:{" "}
                      <Link href={`/tours/${review.tour.slug}`} className="font-semibold text-teal-700 hover:text-teal-800">
                        {review.tour.title}
                      </Link>{" "}
                      - {review.tour.location.name}
                    </p>
                    <Link
                      href={`/tours/${review.tour.slug}`}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Xem tour
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-slate-600">
                  Trang <span className="font-semibold text-slate-900">{currentPage}</span> / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageHref(currentPage - 1)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 font-medium text-slate-700 transition hover:bg-white"
                    >
                      Trang trước
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 font-medium text-slate-400">
                      Trang trước
                    </span>
                  )}
                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageHref(currentPage + 1)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 font-medium text-slate-700 transition hover:bg-white"
                    >
                      Trang sau
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 font-medium text-slate-400">
                      Trang sau
                    </span>
                  )}
                </div>
              </div>
            ) : null}
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
            title="Chưa có đánh giá hiển thị"
            description="Hiện tại chưa có đánh giá nào đủ điều kiện hiển thị."
            ctaHref="/tours"
            ctaLabel="Xem danh sách tour"
          />
        )}
      </section>

      <MobileQuickActions
        items={[
          { href: "#bo-loc-danh-gia", label: "Lọc đánh giá", icon: ListFilter },
          { href: "#ket-qua-danh-gia", label: "Danh sách", icon: List, active: true },
          { href: "/tai-khoan#danh-gia", label: "Tài khoản", icon: UserCircle2 },
        ]}
      />
    </div>
  );
}
