import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SectionHeading } from "@/components/common/section-heading";
import { TourCard } from "@/components/tour/tour-card";
import { getTours, type TourFilterInput } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tour du lịch",
  description: "Khám phá danh sách tour du lịch với bộ lọc theo điểm đến, giá và thời lượng.",
};

type ToursPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type TourSortValue = NonNullable<TourFilterInput["sort"]>;

const durationLabels: Record<NonNullable<TourFilterInput["duration"]>, string> = {
  "duoi-3-ngay": "Dưới 3 ngày",
  "tu-3-den-5-ngay": "Từ 3 đến 5 ngày",
  "tren-5-ngay": "Trên 5 ngày",
};

const sortLabels: Record<TourSortValue, string> = {
  "moi-nhat": "Mới nhất",
  "gia-tang": "Giá tăng dần",
  "gia-giam": "Giá giảm dần",
  "danh-gia-cao": "Đánh giá cao",
};

const durationQuickOptions: Array<{ value: NonNullable<TourFilterInput["duration"]>; label: string }> = [
  { value: "duoi-3-ngay", label: "Dưới 3 ngày" },
  { value: "tu-3-den-5-ngay", label: "3-5 ngày" },
  { value: "tren-5-ngay", label: "Trên 5 ngày" },
];

const sortQuickOptions: Array<{ value: TourSortValue; label: string }> = [
  { value: "moi-nhat", label: "Mới nhất" },
  { value: "gia-tang", label: "Giá tăng dần" },
  { value: "gia-giam", label: "Giá giảm dần" },
  { value: "danh-gia-cao", label: "Đánh giá cao" },
];

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function toNumber(value?: string) {
  if (!value) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  return num >= 0 ? num : undefined;
}

function parseDuration(value: string): TourFilterInput["duration"] | undefined {
  if (value === "duoi-3-ngay" || value === "tu-3-den-5-ngay" || value === "tren-5-ngay") {
    return value;
  }
  return undefined;
}

function parseSort(value: string): NonNullable<TourFilterInput["sort"]> {
  if (value === "gia-tang" || value === "gia-giam" || value === "danh-gia-cao") {
    return value;
  }
  return "moi-nhat";
}

function parseFilters(raw: Record<string, string | string[] | undefined>): TourFilterInput {
  const search = normalizeParam(raw.search);
  const location = normalizeParam(raw.location);
  const duration = parseDuration(normalizeParam(raw.duration));
  const featured = normalizeParam(raw.featured);
  const sort = parseSort(normalizeParam(raw.sort));
  const page = Math.max(toNumber(normalizeParam(raw.page)) ?? 1, 1);

  return {
    search: search || undefined,
    location: location || undefined,
    minPrice: toNumber(normalizeParam(raw.minPrice)),
    maxPrice: toNumber(normalizeParam(raw.maxPrice)),
    duration,
    featured: featured === "1",
    sort,
    page,
    pageSize: 9,
  };
}

function buildToursHref(
  raw: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | number | undefined>,
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
    if (value === undefined || value === "") {
      query.delete(key);
      continue;
    }
    query.set(key, String(value));
  }

  const serialized = query.toString();
  return serialized ? `/tours?${serialized}` : "/tours";
}

function formatPriceFilter(minPrice?: number, maxPrice?: number) {
  if (typeof minPrice === "number" && typeof maxPrice === "number") {
    return `${minPrice.toLocaleString("vi-VN")} - ${maxPrice.toLocaleString("vi-VN")} VND`;
  }
  if (typeof minPrice === "number") {
    return `Từ ${minPrice.toLocaleString("vi-VN")} VND`;
  }
  if (typeof maxPrice === "number") {
    return `Đến ${maxPrice.toLocaleString("vi-VN")} VND`;
  }
  return "";
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const rawParams = await searchParams;
  const filters = parseFilters(rawParams);
  const data = await getTours(filters).catch(() => ({
    tours: [],
    locations: [],
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 1,
  }));
  const selectedLocation = data.locations.find((location) => location.slug === filters.location);
  const activeFilterLabels = [
    ...(filters.search ? [`Từ khóa: ${filters.search}`] : []),
    ...(selectedLocation ? [`Điểm đến: ${selectedLocation.name}`] : []),
    ...(filters.duration ? [`Thời lượng: ${durationLabels[filters.duration]}`] : []),
    ...(filters.featured ? ["Chỉ tour nổi bật"] : []),
    ...((filters.sort && filters.sort !== "moi-nhat") ? [`Sắp xếp: ${sortLabels[filters.sort]}`] : []),
    ...(formatPriceFilter(filters.minPrice, filters.maxPrice)
      ? [`Giá: ${formatPriceFilter(filters.minPrice, filters.maxPrice)}`]
      : []),
  ];

  return (
    <div className="space-y-8 py-6 pb-24 lg:pb-6">
      <SectionHeading
        eyebrow="Tour du lịch"
        title="Tìm kiếm hành trình phù hợp với bạn"
        description="Lọc theo điểm đến, khoảng giá, thời lượng và sắp xếp theo nhu cầu."
      />

      <div id="bo-loc-tour" className="scroll-mt-24" />
      <form className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-2 lg:grid-cols-6">
        <input type="hidden" name="page" value="1" />

        <div className="lg:col-span-2">
          <label htmlFor="search" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Từ khóa
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="search"
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Ví dụ: Đà Nẵng, biển, nghỉ dưỡng..."
              className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Điểm đến
          </label>
          <select
            id="location"
            name="location"
            defaultValue={filters.location ?? ""}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tất cả</option>
            {data.locations.map((location) => (
              <option key={location.id} value={location.slug}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="duration" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Thời lượng
          </label>
          <select
            id="duration"
            name="duration"
            defaultValue={filters.duration ?? ""}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tất cả</option>
            <option value="duoi-3-ngay">Dưới 3 ngày</option>
            <option value="tu-3-den-5-ngay">Từ 3 đến 5 ngày</option>
            <option value="tren-5-ngay">Trên 5 ngày</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Sắp xếp
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={filters.sort ?? "moi-nhat"}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="moi-nhat">Mới nhất</option>
            <option value="gia-tang">Giá tăng dần</option>
            <option value="gia-giam">Giá giảm dần</option>
            <option value="danh-gia-cao">Đánh giá cao</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <div>
            <label htmlFor="minPrice" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Giá từ
            </label>
            <input
              id="minPrice"
              name="minPrice"
              type="number"
              min={0}
              defaultValue={filters.minPrice ?? ""}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="maxPrice" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Đến
            </label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              min={0}
              defaultValue={filters.maxPrice ?? ""}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground lg:col-span-2">
          <input type="checkbox" name="featured" value="1" defaultChecked={filters.featured} className="h-4 w-4" />
          Chỉ hiển thị tour nổi bật
        </label>

        <div className="flex gap-2 lg:col-span-4 lg:justify-end">
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Lọc tour
          </button>
          <Link
            href="/tours"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Xóa lọc
          </Link>
        </div>
      </form>

      <div className="rounded-2xl border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lọc nhanh</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={buildToursHref(rawParams, {
              featured: filters.featured ? "" : "1",
              page: 1,
            })}
            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
              filters.featured
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {filters.featured ? "Bỏ lọc nổi bật" : "Chỉ tour nổi bật"}
          </Link>
          {durationQuickOptions.map((option) => (
            <Link
              key={option.value}
              href={buildToursHref(rawParams, {
                duration: filters.duration === option.value ? "" : option.value,
                page: 1,
              })}
              className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
                filters.duration === option.value
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {sortQuickOptions.map((option) => (
            <Link
              key={option.value}
              href={buildToursHref(rawParams, {
                sort: option.value,
                page: 1,
              })}
              className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${
                filters.sort === option.value
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Đang hiển thị <span className="font-semibold text-foreground">{data.tours.length}</span> tour trong trang này,
          tổng <span className="font-semibold text-foreground">{data.total}</span> tour phù hợp.
        </p>
        {activeFilterLabels.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {activeFilterLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div id="ket-qua-tour" className="scroll-mt-24" />
      {data.tours.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Trang {data.page} / {data.totalPages} • Tổng {data.total} tour
            </p>
            <div className="flex items-center gap-2">
              {data.page > 1 ? (
                <Link
                  href={buildToursHref(rawParams, {
                    page: data.page - 1,
                  })}
                  className="inline-flex h-8 items-center rounded-md border px-3 transition-colors hover:bg-muted"
                >
                  Trang trước
                </Link>
              ) : (
                <span className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 text-slate-400">
                  Trang trước
                </span>
              )}

              {data.page < data.totalPages ? (
                <Link
                  href={buildToursHref(rawParams, {
                    page: data.page + 1,
                  })}
                  className="inline-flex h-8 items-center rounded-md border px-3 transition-colors hover:bg-muted"
                >
                  Trang sau
                </Link>
              ) : (
                <span className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 text-slate-400">
                  Trang sau
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Không tìm thấy tour phù hợp"
          description="Hãy thay đổi bộ lọc hoặc từ khóa để xem thêm kết quả."
          ctaHref="/tours"
          ctaLabel="Xem toàn bộ tour"
        />
      )}

      <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">
        <a
          href="#bo-loc-tour"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Lọc tour
        </a>
        <a
          href="#ket-qua-tour"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Kết quả
        </a>
        <Link
          href="/favorites"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
        >
          Yêu thích
        </Link>
      </div>
    </div>
  );
}
