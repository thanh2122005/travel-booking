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

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function toNumber(value?: string) {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseFilters(raw: Record<string, string | string[] | undefined>): TourFilterInput {
  const search = normalizeParam(raw.search);
  const location = normalizeParam(raw.location);
  const duration = normalizeParam(raw.duration);
  const featured = normalizeParam(raw.featured);
  const sort = normalizeParam(raw.sort);
  const page = toNumber(normalizeParam(raw.page)) ?? 1;

  return {
    search: search || undefined,
    location: location || undefined,
    minPrice: toNumber(normalizeParam(raw.minPrice)),
    maxPrice: toNumber(normalizeParam(raw.maxPrice)),
    duration: duration ? (duration as TourFilterInput["duration"]) : undefined,
    featured: featured === "1",
    sort: sort ? (sort as TourFilterInput["sort"]) : "moi-nhat",
    page,
    pageSize: 9,
  };
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

  return (
    <div className="space-y-8 py-6">
      <SectionHeading
        eyebrow="Tour du lịch"
        title="Tìm kiếm hành trình phù hợp với bạn"
        description="Lọc theo điểm đến, khoảng giá, thời lượng và sắp xếp theo nhu cầu."
      />

      <form className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-2 lg:grid-cols-6">
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
            Áp dụng bộ lọc
          </button>
          <Link
            href="/tours"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Xóa lọc
          </Link>
        </div>
      </form>

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
              <Link
                href={{
                  pathname: "/tours",
                  query: { ...rawParams, page: String(Math.max(data.page - 1, 1)) },
                }}
                className="inline-flex h-8 items-center rounded-md border px-3 transition-colors hover:bg-muted"
              >
                Trang trước
              </Link>
              <Link
                href={{
                  pathname: "/tours",
                  query: { ...rawParams, page: String(Math.min(data.page + 1, data.totalPages)) },
                }}
                className="inline-flex h-8 items-center rounded-md border px-3 transition-colors hover:bg-muted"
              >
                Trang sau
              </Link>
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
    </div>
  );
}
