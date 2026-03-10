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
  description: "Danh sách điểm đến du lịch Việt Nam với route dynamic và dữ liệu từ Prisma.",
};

type DestinationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function DestinationsPage({ searchParams }: DestinationsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const locations = await getLocations(search || undefined).catch(() => []);

  return (
    <div className="space-y-8">
      <HomeSectionHeading
        eyebrow="Điểm đến"
        title="Khám phá điểm đến Việt Nam"
        description="Route này thay thế cho mô hình trang thành phố tĩnh, gom vào hệ thống dynamic /destinations/[slug]."
      />

      <form className="iv-card p-4">
        <label htmlFor="destination-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm điểm đến
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              id="destination-search"
              name="search"
              defaultValue={search}
              placeholder="Ví dụ: Đà Nẵng, Hà Nội, Phú Quốc..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="iv-btn-primary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold">
            Tìm kiếm
          </button>
        </div>
      </form>

      {locations.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <article key={location.id} className="iv-card overflow-hidden">
              <Link href={`/destinations/${location.slug}`} className="group block">
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
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">{location.name}</h3>
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
          description="Thử từ khóa khác để tìm thông tin điểm đến phù hợp."
          ctaHref="/destinations"
          ctaLabel="Xem tất cả điểm đến"
        />
      )}
    </div>
  );
}
