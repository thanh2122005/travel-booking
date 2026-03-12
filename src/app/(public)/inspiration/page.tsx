import Link from "next/link";
import { CalendarDays, Search } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { SafeImage } from "@/components/common/safe-image";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getLocations } from "@/lib/db/public-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type InspirationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type InspirationSortValue = "moi-cap-nhat" | "noi-bat" | "ten-a-z";
type InspirationQueryOverrides = {
  search?: string;
  sort?: InspirationSortValue;
  featured?: boolean;
  page?: number;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseSort(value: string): InspirationSortValue {
  if (value === "noi-bat" || value === "ten-a-z") {
    return value;
  }
  return "moi-cap-nhat";
}

function parsePage(value: string) {
  const page = Number(value);
  if (!Number.isFinite(page)) return 1;
  const normalized = Math.trunc(page);
  return normalized >= 1 ? normalized : 1;
}

function buildInspirationHref(
  state: {
    search: string;
    sort: InspirationSortValue;
    featuredOnly: boolean;
    page: number;
  },
  overrides: InspirationQueryOverrides = {},
) {
  const nextSearch = overrides.search ?? state.search;
  const nextSort = overrides.sort ?? state.sort;
  const nextFeaturedOnly = overrides.featured ?? state.featuredOnly;
  const nextPage = overrides.page ?? state.page;
  const query = new URLSearchParams();

  if (nextSearch) {
    query.set("search", nextSearch);
  }
  if (nextSort !== "moi-cap-nhat") {
    query.set("sort", nextSort);
  }
  if (nextFeaturedOnly) {
    query.set("featured", "1");
  }
  if (nextPage > 1) {
    query.set("page", String(nextPage));
  }

  const serialized = query.toString();
  return serialized ? `/inspiration?${serialized}` : "/inspiration";
}

export default async function InspirationPage({ searchParams }: InspirationPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search).trim();
  const sort = parseSort(normalizeParam(params.sort));
  const featuredOnly = normalizeParam(params.featured) === "1";
  const requestedPage = parsePage(normalizeParam(params.page));
  const hasActiveFilters = Boolean(search || featuredOnly || sort !== "moi-cap-nhat");

  const locations = await getLocations(search || undefined).catch(() => []);
  const filteredLocations = locations
    .filter((location) => !featuredOnly || location.featured)
    .slice()
    .sort((a, b) => {
      if (sort === "ten-a-z") {
        return a.name.localeCompare(b.name, "vi");
      }
      if (sort === "noi-bat") {
        if (Number(b.featured) === Number(a.featured)) {
          return +new Date(b.updatedAt) - +new Date(a.updatedAt);
        }
        return Number(b.featured) - Number(a.featured);
      }
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredLocations.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleLocations = filteredLocations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const state = {
    search,
    sort,
    featuredOnly,
    page: currentPage,
  };
  const clearFiltersHref = buildInspirationHref(state, {
    search: "",
    sort: "moi-cap-nhat",
    featured: false,
    page: 1,
  });
  const buildPageHref = (page: number) => buildInspirationHref(state, { page });

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Cảm hứng"
        title="Cảm hứng du lịch Việt Nam"
        description="Khơi gợi cảm hứng du lịch từ những câu chuyện điểm đến và trải nghiệm bản địa chân thực."
        videoSrc="/immerse-vietnam/videos/vietnamBlog.mp4"
      />

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HomeSectionHeading
            eyebrow="Câu chuyện"
            title="Những hành trình đang truyền cảm hứng"
            description={`Hiển thị ${visibleLocations.length}/${filteredLocations.length} bài viết trên trang ${currentPage}/${totalPages}.`}
          />
          <Link href="/dia-diem" className="iv-btn-soft inline-flex h-10 items-center px-4 text-sm font-semibold">
            Xem tất cả điểm đến
          </Link>
        </div>

        <form className="iv-card p-4">
          <label
            htmlFor="inspiration-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
          >
            Tìm kiếm câu chuyện điểm đến
          </label>
          <div className="grid gap-2 md:grid-cols-[1fr_170px_170px_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                id="inspiration-search"
                name="search"
                defaultValue={search}
                placeholder="Tên điểm đến hoặc tỉnh/thành..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <select
              name="sort"
              defaultValue={sort}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="moi-cap-nhat">Mới cập nhật</option>
              <option value="noi-bat">Ưu tiên nổi bật</option>
              <option value="ten-a-z">Tên A-Z</option>
            </select>
            <label className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="featured"
                value="1"
                defaultChecked={featuredOnly}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              Chỉ nổi bật
            </label>
            <button
              type="submit"
              className="iv-btn-primary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold"
            >
              Lọc bài viết
            </button>
            {hasActiveFilters ? (
              <Link
                href={clearFiltersHref}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>
        </form>

        {visibleLocations.length ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleLocations.map((location) => (
                <article key={location.id} className="iv-card overflow-hidden">
                  <Link href={`/dia-diem/${location.slug}`} className="group block">
                    <div className="relative h-52">
                      <SafeImage
                        src={location.imageUrl}
                        alt={location.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="space-y-2 p-5">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 text-teal-600" />
                        Cập nhật: {formatDate(location.updatedAt)}
                      </p>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900">
                        {location.name}: {location.shortDescription}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-7 text-slate-600">{location.description}</p>
                    </div>
                  </Link>
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
        ) : locations.length ? (
          <EmptyState
            title="Không có bài viết phù hợp"
            description="Hãy thử đổi từ khóa hoặc bỏ lọc để xem thêm câu chuyện điểm đến."
            ctaHref={clearFiltersHref}
            ctaLabel="Xóa bộ lọc"
          />
        ) : (
          <EmptyState
            title="Chưa có dữ liệu cảm hứng"
            description="Hiện chưa có điểm đến nào để hiển thị bài viết."
            ctaHref="/dia-diem"
            ctaLabel="Xem danh sách điểm đến"
          />
        )}
      </section>
    </div>
  );
}
