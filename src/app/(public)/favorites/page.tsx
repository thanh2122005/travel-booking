import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { SafeImage } from "@/components/common/safe-image";
import { FavoriteRemoveButton } from "@/components/favorite/favorite-remove-button";
import { getAuthSession } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/db/user-queries";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type FavoritesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type FavoriteSortValue = "newest" | "price-asc" | "price-desc";
type FavoriteQueryOverrides = {
  search?: string;
  sort?: FavoriteSortValue;
  page?: number;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseSort(value: string): FavoriteSortValue {
  if (value === "price-asc" || value === "price-desc") {
    return value;
  }
  return "newest";
}

function parsePage(value: string) {
  const page = Number(value);
  if (!Number.isFinite(page)) return 1;
  const normalized = Math.trunc(page);
  return normalized >= 1 ? normalized : 1;
}

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const sort = parseSort(normalizeParam(params.sort));
  const requestedPage = parsePage(normalizeParam(params.page));
  const hasActiveFilters = Boolean(search || sort !== "newest");

  const session = await getAuthSession();
  const dashboard = session?.user?.id ? await getUserDashboardData(session.user.id).catch(() => null) : null;
  const favorites = dashboard?.favorites ?? [];
  const normalizedSearch = search.trim().toLowerCase();

  const filteredFavorites = favorites
    .filter((favorite) => {
      if (!normalizedSearch) return true;
      return (
        favorite.tour.title.toLowerCase().includes(normalizedSearch) ||
        favorite.tour.shortDescription.toLowerCase().includes(normalizedSearch) ||
        favorite.tour.location.name.toLowerCase().includes(normalizedSearch)
      );
    })
    .slice()
    .sort((a, b) => {
      const priceA = a.tour.discountPrice ?? a.tour.price;
      const priceB = b.tour.discountPrice ?? b.tour.price;

      if (sort === "price-asc") return priceA - priceB;
      if (sort === "price-desc") return priceB - priceA;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredFavorites.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const pagedFavorites = filteredFavorites.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const buildFavoritesHref = (overrides: FavoriteQueryOverrides = {}) => {
    const nextSearch = overrides.search ?? search;
    const nextSort = overrides.sort ?? sort;
    const nextPage = overrides.page ?? currentPage;
    const query = new URLSearchParams();

    if (nextSearch) {
      query.set("search", nextSearch);
    }
    if (nextSort !== "newest") {
      query.set("sort", nextSort);
    }
    if (nextPage > 1) {
      query.set("page", String(nextPage));
    }

    const serialized = query.toString();
    return serialized ? `/favorites?${serialized}` : "/favorites";
  };
  const buildPageHref = (page: number) => buildFavoritesHref({ page });
  const clearFiltersHref = buildFavoritesHref({ search: "", sort: "newest", page: 1 });

  return (
    <div className="space-y-8">
      <div className="iv-card overflow-hidden bg-[linear-gradient(130deg,#091f33,#0a314d,#085a66)] p-7 text-white md:p-9">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
          <Heart className="h-4 w-4" />
          Tour yêu thích
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Danh sách tour yêu thích</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          Tour bạn lưu từ trang chi tiết sẽ xuất hiện tại đây để tiện so sánh và đặt nhanh khi cần.
        </p>
      </div>

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Đã lưu"
          title="Tour bạn đang theo dõi"
          description={`Hiển thị ${pagedFavorites.length}/${filteredFavorites.length} tour trên trang ${currentPage}/${totalPages}.`}
        />

        <form className="iv-card p-4">
          <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Tìm kiếm tour yêu thích
          </label>
          <div className="grid gap-2 md:grid-cols-[1fr_180px_auto_auto]">
            <input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Tên tour, điểm đến hoặc mô tả..."
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
            <select
              name="sort"
              defaultValue={sort}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="newest">Mới lưu gần đây</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
            <button
              type="submit"
              className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
            >
              Áp dụng
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

        {favorites.length ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildFavoritesHref({ sort: "newest", page: 1 })}
              className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                sort === "newest"
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Mới lưu gần đây
            </Link>
            <Link
              href={buildFavoritesHref({ sort: "price-asc", page: 1 })}
              className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                sort === "price-asc"
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Giá tăng dần
            </Link>
            <Link
              href={buildFavoritesHref({ sort: "price-desc", page: 1 })}
              className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                sort === "price-desc"
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Giá giảm dần
            </Link>
          </div>
        ) : null}

        {filteredFavorites.length ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedFavorites.map((favorite) => {
                const displayPrice = favorite.tour.discountPrice ?? favorite.tour.price;

                return (
                  <article key={favorite.id} className="iv-card overflow-hidden">
                    <Link href={`/tours/${favorite.tour.slug}`} className="group block">
                      <div className="relative h-52">
                        <SafeImage
                          src={favorite.tour.featuredImage}
                          alt={favorite.tour.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    </Link>
                    <div className="space-y-2 p-5">
                      <Link href={`/tours/${favorite.tour.slug}`} className="line-clamp-2 text-lg font-semibold text-slate-900 hover:text-teal-700">
                        {favorite.tour.title}
                      </Link>
                      <p className="line-clamp-2 text-sm leading-7 text-slate-600">{favorite.tour.shortDescription}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{favorite.tour.location.name}</p>
                      <div className="pt-1">
                        <p className="text-lg font-bold text-teal-700">{formatPrice(displayPrice)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Link
                            href={`/tours/${favorite.tour.slug}`}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Xem chi tiết
                          </Link>
                          {session?.user ? (
                            <FavoriteRemoveButton
                              tourId={favorite.tour.id}
                              className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-70"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
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
        ) : favorites.length ? (
          <EmptyState
            title="Không tìm thấy tour phù hợp"
            description="Hãy thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách."
            ctaHref="/favorites"
            ctaLabel="Xóa bộ lọc"
          />
        ) : session?.user ? (
          <EmptyState
            title="Chưa có tour yêu thích"
            description="Bạn có thể nhấn nút yêu thích trong trang tour detail để lưu nhanh."
            ctaHref="/tours"
            ctaLabel="Khám phá tour"
          />
        ) : (
          <EmptyState
            title="Đăng nhập để xem tour yêu thích"
            description="Danh sách yêu thích gắn với tài khoản, vui lòng đăng nhập để tiếp tục."
            ctaHref="/dang-nhap?callbackUrl=/favorites"
            ctaLabel="Đăng nhập"
          />
        )}
      </section>
    </div>
  );
}
