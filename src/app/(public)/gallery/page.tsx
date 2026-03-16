import Link from "next/link";
import { Grid3X3, List, ListFilter, MapPin, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { SafeImage } from "@/components/common/safe-image";
import { getLocations } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

type GalleryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type GalleryQueryOverrides = {
  location?: string;
  page?: number;
};

const fallbackGalleryImages = [
  "/immerse-vietnam/images/gallery1.jpg",
  "/immerse-vietnam/images/gallery2.webp",
  "/immerse-vietnam/images/gallery3.jpg",
  "/immerse-vietnam/images/gallery4.jpg",
  "/immerse-vietnam/images/gallery5.jpg",
  "/immerse-vietnam/images/gallery6.jpg",
  "/immerse-vietnam/images/gallery7.jpg",
  "/immerse-vietnam/images/gallery8.jpg",
  "/immerse-vietnam/images/HoiAn/hoiancover.jpg",
];

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parsePage(value: string) {
  const page = Number(value);
  if (!Number.isFinite(page)) return 1;
  const normalized = Math.trunc(page);
  return normalized >= 1 ? normalized : 1;
}

function buildGalleryHref(
  state: {
    location: string;
    page: number;
  },
  overrides: GalleryQueryOverrides = {},
) {
  const nextLocation = overrides.location ?? state.location;
  const nextPage = overrides.page ?? state.page;
  const query = new URLSearchParams();

  if (nextLocation) {
    query.set("location", nextLocation);
  }
  if (nextPage > 1) {
    query.set("page", String(nextPage));
  }

  const serialized = query.toString();
  return serialized ? `/gallery?${serialized}` : "/gallery";
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const requestedLocation = normalizeParam(params.location).trim();
  const requestedPage = parsePage(normalizeParam(params.page));

  const locations = await getLocations().catch(() => []);
  const locationOptions = locations
    .slice()
    .sort((a, b) => {
      if (Number(b.featured) === Number(a.featured)) {
        return a.name.localeCompare(b.name, "vi");
      }
      return Number(b.featured) - Number(a.featured);
    })
    .map((location) => ({
      slug: location.slug,
      name: location.name,
    }));

  const location = locationOptions.some((item) => item.slug === requestedLocation) ? requestedLocation : "";
  const selectedLocationName = locationOptions.find((item) => item.slug === location)?.name ?? "";
  const hasActiveFilters = Boolean(location);

  const sourceEntries = locations.flatMap((location) =>
    [location.imageUrl, ...(Array.isArray(location.gallery) ? location.gallery : [])]
      .filter((image): image is string => Boolean(image))
      .map((src) => ({
        src,
        locationSlug: location.slug,
        locationName: location.name,
      })),
  );

  const uniqueEntries = new Map<
    string,
    {
      src: string;
      locationSlug: string;
      locationName: string;
    }
  >();

  for (const item of sourceEntries) {
    if (!uniqueEntries.has(item.src)) {
      uniqueEntries.set(item.src, item);
    }
  }

  for (const src of fallbackGalleryImages) {
    if (!uniqueEntries.has(src)) {
      uniqueEntries.set(src, {
        src,
        locationSlug: "",
        locationName: "",
      });
    }
  }

  const galleryEntries = Array.from(uniqueEntries.values());
  const filteredEntries = location
    ? galleryEntries.filter((item) => item.locationSlug === location)
    : galleryEntries;

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const state = {
    location,
    page: currentPage,
  };
  const clearFiltersHref = buildGalleryHref(state, { location: "", page: 1 });
  const buildPageHref = (page: number) => buildGalleryHref(state, { page });

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <section className="overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top,_#1e3a8a_0%,_#0f172a_40%,_#020617_100%)] p-7 text-white md:p-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" />
          Thư viện hình ảnh
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
          Khoảnh khắc du lịch Việt Nam qua từng khung hình
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
          {selectedLocationName
            ? `Bạn đang xem bộ ảnh theo địa điểm ${selectedLocationName}. Chọn địa điểm khác để khám phá thêm góc nhìn mới.`
            : "Bộ sưu tập ảnh được tổng hợp từ điểm đến nổi bật, giúp bạn hình dung rõ trải nghiệm trước khi đặt tour."}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Tổng ảnh</p>
            <p className="mt-2 text-2xl font-black">{filteredEntries.length}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Điểm đến</p>
            <p className="mt-2 text-2xl font-black">{locationOptions.length}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Trang hiện tại</p>
            <p className="mt-2 text-2xl font-black">{currentPage}/{totalPages}</p>
          </article>
        </div>
      </section>

      <section className="space-y-5">
        <div id="bo-loc-thu-vien" className="scroll-mt-24" />
        <form className="iv-card p-4">
          <input type="hidden" name="page" value="1" />
          <label htmlFor="gallery-location" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Lọc thư viện theo địa điểm
          </label>
          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <select
              id="gallery-location"
              name="location"
              defaultValue={location}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Tất cả địa điểm</option>
              {locationOptions.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <button type="submit" className="iv-btn-primary inline-flex h-11 items-center justify-center px-5 text-sm font-semibold">
              Lọc ảnh
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

        {locationOptions.length ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildGalleryHref(state, { location: "", page: 1 })}
              className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                !location
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Tất cả
            </Link>
            {locationOptions.slice(0, 10).map((item) => (
              <Link
                key={item.slug}
                href={buildGalleryHref(state, { location: item.slug, page: 1 })}
                className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                  location === item.slug
                    ? "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <div id="ket-qua-thu-vien" className="scroll-mt-24" />
      {visibleEntries.length ? (
        <section className="space-y-4">
          <article className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
            Hiển thị <span className="font-semibold text-foreground">{visibleEntries.length}</span> /{" "}
            <span className="font-semibold text-foreground">{filteredEntries.length}</span> ảnh.
          </article>

          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
            {visibleEntries.map((item, index) => (
              <article key={`${item.src}-${index}`} className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className={`relative ${index % 3 === 0 ? "h-[360px]" : index % 2 === 0 ? "h-[300px]" : "h-[260px]"}`}>
                  <SafeImage
                    src={item.src}
                    alt={`Ảnh du lịch ${item.locationName || "Việt Nam"}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="flex items-center justify-between p-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    {item.locationName || "Việt Nam"}
                  </span>
                  <span>#{index + 1 + (currentPage - 1) * pageSize}</span>
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
        </section>
      ) : galleryEntries.length ? (
        <EmptyState
          title="Không có ảnh phù hợp"
          description="Hãy thử chọn địa điểm khác hoặc xóa bộ lọc để xem toàn bộ thư viện."
          ctaHref={clearFiltersHref}
          ctaLabel="Xóa bộ lọc"
        />
      ) : (
        <EmptyState
          title="Chưa có ảnh hiển thị"
          description="Hiện chưa có dữ liệu ảnh từ hệ thống."
          ctaHref="/dia-diem"
          ctaLabel="Xem điểm đến"
        />
      )}

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Điểm đến nổi bật trong thư viện</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.slice(0, 6).map((item) => (
            <article key={item.id} className="iv-card overflow-hidden">
              <Link href={`/dia-diem/${item.slug}`} className="group block">
                <div className="relative h-52">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-1.5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">{item.provinceOrCity}</p>
                  <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <MobileQuickActions
        items={[
          { href: "#bo-loc-thu-vien", label: "Lọc ảnh", icon: ListFilter },
          { href: "#ket-qua-thu-vien", label: "Kết quả", icon: List, active: true },
          { href: "/dia-diem", label: "Điểm đến", icon: MapPin },
        ]}
      />
    </div>
  );
}

