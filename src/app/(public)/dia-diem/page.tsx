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

export default async function DestinationsPage({ searchParams }: DestinationsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const sort = parseSort(normalizeParam(params.sort));
  const featuredOnly = normalizeParam(params.featured) === "1";

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
  const hasActiveFilters = Boolean(search || featuredOnly || sort !== "noi-bat");

  return (
    <div className="space-y-8">
      <HomeSectionHeading
        eyebrow="Điểm đến"
        title="Khám phá điểm đến Việt Nam"
        description="Khám phá các thành phố và vùng du lịch nổi bật với thông tin chi tiết, dễ tra cứu."
      />

      <form className="iv-card p-4">
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
            Áp dụng
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

      <article className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        Hiển thị <span className="font-semibold text-foreground">{filteredLocations.length}</span> /{" "}
        <span className="font-semibold text-foreground">{locations.length}</span> điểm đến.
      </article>

      {filteredLocations.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredLocations.map((location) => (
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
      ) : (
        <EmptyState
          title="Không tìm thấy điểm đến"
          description="Thử từ khóa khác hoặc xóa bộ lọc để xem đầy đủ danh sách."
          ctaHref="/dia-diem"
          ctaLabel="Xem tất cả điểm đến"
        />
      )}
    </div>
  );
}
