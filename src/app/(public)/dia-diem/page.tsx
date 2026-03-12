import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SafeImage } from "@/components/common/safe-image";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getLocations } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Điểm đến",
  description: "Danh sách điểm đến du lịch Việt Nam được cập nhật liên tục theo dữ liệu hệ thống.",
};

type DestinationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type DestinationSortValue = "noi-bat" | "ten-a-z" | "ten-z-a";
const pageSize = 9;

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseSort(value: string): DestinationSortValue {
  if (value === "ten-a-z" || value === "ten-z-a") {
    return value;
  }
  return "noi-bat";
}

function parsePage(value: string) {
  const page = Number(value || "1");
  if (!Number.isFinite(page)) return 1;
  const normalized = Math.trunc(page);
  return normalized >= 1 ? normalized : 1;
}

function buildDestinationsHref(
  raw: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | undefined>,
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(raw)) {
    if (!value) continue;
    const normalized = Array.isArray(value) ? value[0] ?? "" : value;
    if (normalized) {
      query.set(key, normalized);
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (!value) {
      query.delete(key);
      continue;
    }
    query.set(key, value);
  }

  const serialized = query.toString();
  return serialized ? `/dia-diem?${serialized}` : "/dia-diem";
}

export default async function DestinationsPage({ searchParams }: DestinationsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const sort = parseSort(normalizeParam(params.sort));
  const featuredOnly = normalizeParam(params.featured) === "1";
  const requestedPage = parsePage(normalizeParam(params.page));

  const locations = await getLocations(search || undefined).catch(() => []);
  const filteredLocations = locations
    .filter((location) => !featuredOnly || location.featured)
    .slice()
    .sort((a, b) => {
      if (sort === "ten-a-z") {
        return a.name.localeCompare(b.name, "vi");
      }
      if (sort === "ten-z-a") {
        return b.name.localeCompare(a.name, "vi");
      }

      if (Number(b.featured) !== Number(a.featured)) {
        return Number(b.featured) - Number(a.featured);
      }
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });
  const totalPages = Math.max(1, Math.ceil(filteredLocations.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const pagedLocations = filteredLocations.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasActiveFilters = Boolean(search || featuredOnly || sort !== "noi-bat");

  return (
    <div className="space-y-8 pb-24 lg:pb-0">
      <HomeSectionHeading
        eyebrow="Điểm đến"
        title="Khám phá điểm đến Việt Nam"
        description="Khám phá các thành phố và vùng du lịch nổi bật với thông tin chi tiết, dễ tra cứu."
      />

      <div id="bo-loc-dia-diem" className="scroll-mt-24" />
      <form className="iv-card p-4">
        <input type="hidden" name="page" value="1" />
        <label htmlFor="destination-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm điểm đến
        </label>
        <div className="grid gap-2 md:grid-cols-[1fr_170px_170px_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              id="destination-search"
              name="search"
              defaultValue={search}
              placeholder="Ví dụ: Đà Nẵng, Hà Nội, Phú Quốc..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <select
            name="sort"
            defaultValue={sort}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="noi-bat">Ưu tiên nổi bật</option>
            <option value="ten-a-z">Tên A-Z</option>
            <option value="ten-z-a">Tên Z-A</option>
          </select>
          <label className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <input type="checkbox" name="featured" value="1" defaultChecked={featuredOnly} className="h-4 w-4 rounded border-slate-300 accent-teal-600" />
            Chỉ nổi bật
          </label>
          <button type="submit" className="iv-btn-primary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold">
            Lọc điểm đến
          </button>
          {hasActiveFilters ? (
            <Link
              href="/dia-diem"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Xóa lọc
            </Link>
          ) : null}
        </div>
      </form>

      <div className="iv-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lọc nhanh</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={buildDestinationsHref(params, {
              featured: featuredOnly ? "" : "1",
              page: "1",
            })}
            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
              featuredOnly
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {featuredOnly ? "Bỏ lọc nổi bật" : "Chỉ nổi bật"}
          </Link>
          <Link
            href={buildDestinationsHref(params, { sort: "noi-bat", page: "1" })}
            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
              sort === "noi-bat"
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Ưu tiên nổi bật
          </Link>
          <Link
            href={buildDestinationsHref(params, { sort: "ten-a-z", page: "1" })}
            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
              sort === "ten-a-z"
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Tên A-Z
          </Link>
          <Link
            href={buildDestinationsHref(params, { sort: "ten-z-a", page: "1" })}
            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
              sort === "ten-z-a"
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Tên Z-A
          </Link>
        </div>
      </div>

      <article className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        Hiển thị <span className="font-semibold text-foreground">{pagedLocations.length}</span> /{" "}
        <span className="font-semibold text-foreground">{filteredLocations.length}</span> điểm đến
        {totalPages > 1 ? (
          <>
            {" "}
            - Trang <span className="font-semibold text-foreground">{currentPage}</span>/{totalPages}
          </>
        ) : null}
        .
      </article>

      <div id="ket-qua-dia-diem" className="scroll-mt-24" />
      {filteredLocations.length ? (
        <div className="space-y-4">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pagedLocations.map((location) => (
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
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-slate-900">{location.name}</h3>
                      {location.featured ? (
                        <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-700">
                          Nổi bật
                        </span>
                      ) : null}
                    </div>
                    <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      {location.provinceOrCity}, {location.country}
                    </p>
                    <p className="line-clamp-2 text-sm leading-7 text-slate-600">{location.shortDescription}</p>
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
                    href={buildDestinationsHref(params, { page: String(currentPage - 1) })}
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
                    href={buildDestinationsHref(params, { page: String(currentPage + 1) })}
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
      ) : (
        <EmptyState
          title="Không tìm thấy điểm đến"
          description="Thử từ khóa khác hoặc xóa bộ lọc để xem đầy đủ danh sách."
          ctaHref="/dia-diem"
          ctaLabel="Xem tất cả điểm đến"
        />
      )}

      <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">
        <a
          href="#bo-loc-dia-diem"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Lọc điểm đến
        </a>
        <a
          href="#ket-qua-dia-diem"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Kết quả
        </a>
        <Link
          href="/tours"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
        >
          Xem tour
        </Link>
      </div>
    </div>
  );
}
