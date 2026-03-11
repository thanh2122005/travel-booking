import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { SafeImage } from "@/components/common/safe-image";
import { getAuthSession } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/db/user-queries";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type FavoritesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type FavoriteSortValue = "newest" | "price-asc" | "price-desc";

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

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const sort = parseSort(normalizeParam(params.sort));
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
          description={`Hiển thị ${filteredFavorites.length}/${favorites.length} tour theo bộ lọc hiện tại.`}
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
                href="/favorites"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>
        </form>

        {filteredFavorites.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFavorites.map((favorite) => {
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
                    <div className="space-y-2 p-5">
                      <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{favorite.tour.title}</h3>
                      <p className="line-clamp-2 text-sm leading-7 text-slate-600">{favorite.tour.shortDescription}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{favorite.tour.location.name}</p>
                      <p className="text-lg font-bold text-teal-700">{formatPrice(displayPrice)}</p>
                    </div>
                  </Link>
                </article>
              );
            })}
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
