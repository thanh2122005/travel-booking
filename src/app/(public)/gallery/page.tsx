import Image from "next/image";
import Link from "next/link";
import { List, ListFilter, MapPin, Sparkles } from "lucide-react";
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
  "/immerse-vietnam/images/DaNang/danangcover.jpg",
  "/immerse-vietnam/images/HaNoi/hanoicover.jpg",
  "/immerse-vietnam/images/NhaTrang/nhatrangcover.jpg",
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

  const visualHighlights = [
    "/immerse-vietnam/images/DaNang/danangcover.jpg",
    "/immerse-vietnam/images/HoiAn/hoiancover.jpg",
    "/immerse-vietnam/images/NhaTrang/nhatrangcover.jpg",
  ];

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <section className="grid gap-6 overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,#06213a_0%,#0a4a5f_55%,#0e7490_100%)] p-6 text-white md:grid-cols-[1.15fr_0.85fr] md:p-8">
        <article className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Thư viện điểm đến
          </p>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">Khoảnh khắc du lịch chạm cảm xúc</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-100 md:text-base">
            Tập trung vào hình ảnh thật và không gian điểm đến để bạn cảm nhận trước hành trình, thay vì đọc quá nhiều thông tin kỹ thuật.
          </p>
          <div className="flex flex-wrap gap-2">
            {locationOptions.slice(0, 6).map((item) => (
              <Link
                key={item.slug}
                href={buildGalleryHref(state, { location: item.slug, page: 1 })}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition ${
                  location === item.slug
                    ? "border-white/60 bg-white/20 text-white"
                    : "border-white/30 bg-white/5 text-cyan-100 hover:bg-white/15"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {hasActiveFilters ? (
              <Link
                href={clearFiltersHref}
                className="inline-flex h-8 items-center rounded-full border border-rose-200 bg-rose-50/95 px-3 text-xs font-semibold text-rose-700"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>
        </article>

        <article className="grid gap-3 sm:grid-cols-3 md:grid-cols-2">
          {visualHighlights.map((src, index) => (
            <div key={src} className={`relative overflow-hidden rounded-2xl border border-white/20 ${index === 0 ? "sm:col-span-2 md:col-span-2" : ""} h-40 md:h-32 lg:h-40`}>
              <Image src={src} alt="Hình ảnh điểm đến" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
          ))}
        </article>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <div id="bo-loc-thu-vien" className="scroll-mt-24" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Lọc theo điểm đến</p>
        <form className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <input type="hidden" name="page" value="1" />
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
        </form>
      </section>

      <div id="ket-qua-thu-vien" className="scroll-mt-24" />
      {visibleEntries.length ? (
        <section className="space-y-4">
          <article className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
            {selectedLocationName
              ? `Đang xem ảnh tại ${selectedLocationName}. `
              : "Đang xem toàn bộ thư viện. "}
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
                {item.locationName ? (
                  <div className="flex items-center p-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-teal-600" />
                      {item.locationName}
                    </span>
                  </div>
                ) : null}
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
