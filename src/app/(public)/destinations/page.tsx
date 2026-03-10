import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getLocations } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Danh sach diem den du lich Viet Nam voi route dynamic va du lieu tu Prisma.",
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
  const locations = await getLocations(search || undefined);

  return (
    <div className="space-y-8">
      <HomeSectionHeading
        eyebrow="Destinations"
        title="Kham pha diem den Viet Nam"
        description="Route nay thay the cho mo hinh trang thanh pho tinh, gom vao he thong dynamic /destinations/[slug]."
      />

      <form className="iv-card p-4">
        <label htmlFor="destination-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tim diem den
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              id="destination-search"
              name="search"
              defaultValue={search}
              placeholder="Vi du: Da Nang, Ha Noi, Phu Quoc..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="iv-btn-primary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold">
            Tim kiem
          </button>
        </div>
      </form>

      {locations.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <article key={location.id} className="iv-card overflow-hidden">
              <Link href={`/destinations/${location.slug}`} className="group block">
                <div className="relative h-52">
                  <Image
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
          title="Khong tim thay diem den"
          description="Thu tu khoa khac de tim thong tin diem den phu hop."
          ctaHref="/destinations"
          ctaLabel="Xem tat ca diem den"
        />
      )}
    </div>
  );
}
