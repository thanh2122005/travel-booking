import Image from "next/image";
import Link from "next/link";
import { List, ListFilter, MapPin } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { SafeImage } from "@/components/common/safe-image";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
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

  const spotlightLocations = location
    ? locations
        .filter((item) => item.slug === location)
        .concat(locations.filter((item) => item.slug !== location))
        .slice(0, 6)
    : locations.slice(0, 6);

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <PageHeroBanner
        eyebrow="Thư viện"
        title="Việt Nam qua lăng kính cảm xúc"
        description={
          selectedLocationName
            ? `Khám phá bộ ảnh điểm đến ${selectedLocationName} và lên kế hoạch hành trình theo góc nhìn trực quan.`
            : "Thư viện hình ảnh giúp bạn cảm nhận rõ hơn vẻ đẹp của từng điểm đến trước khi lên lịch trình."
        }
        videoSrc="/immerse-vietnam/videos/blogcover.mp4"
      />

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HomeSectionHeading
            eyebrow="Khoảnh khắc"
            title="Bộ sưu tập hình ảnh du lịch"
            description={`Hiển thị ${visibleEntries.length}/${filteredEntries.length} ảnh trên trang ${currentPage}/${totalPages}.`}
          />
          <Link href="/dia-diem" className="iv-btn-soft inline-flex h-10 items-center px-4 text-sm font-semibold">
            Xem điểm đến
          </Link>
        </div>

        <div id="bo-loc-thu-vien" className="scroll-mt-24" />
        <form className="iv-card p-4">
          <input type="hidden" name="page" value="1" />
          <label htmlFor="gallery-location" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Lọc ảnh theo điểm đến
          </label>
          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <select
              id="gallery-location"
              name="location"
              defaultValue={location}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Tất cả điểm đến</option>
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
            {locationOptions.slice(0, 8).map((item) => (
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

        <div id="ket-qua-thu-vien" className="scroll-mt-24" />
        {visibleEntries.length ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEntries.map((item, index) => (
                <article key={`${item.src}-${index}`} className="group iv-card overflow-hidden">
                  <div className="relative h-64">
                    <Image
                      src={item.src}
                      alt={`Ảnh du lịch Việt Nam ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
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
        ) : galleryEntries.length ? (
          <EmptyState
            title="Không có ảnh phù hợp"
            description="Hãy thử chọn điểm đến khác để xem thêm hình ảnh."
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
      </section>

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Địa điểm nổi bật"
          title="Điểm đến đang được quan tâm"
          description="Danh sách địa điểm được cập nhật từ dữ liệu hệ thống để đảm bảo luôn nhất quán."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {spotlightLocations.map((location) => (
            <article key={location.id} className="iv-card overflow-hidden">
              <Link href={`/dia-diem/${location.slug}`} className="group block">
                <div className="relative h-56">
                  <SafeImage
                    src={location.imageUrl}
                    alt={location.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{location.provinceOrCity}</p>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">{location.name}</h3>
                  <p className="line-clamp-3 text-sm leading-7 text-slate-600">{location.shortDescription}</p>
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
