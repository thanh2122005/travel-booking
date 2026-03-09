import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { SectionHeading } from "@/components/common/section-heading";
import { LocationCard } from "@/components/location/location-card";
import { getLocations } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Địa điểm du lịch",
  description: "Khám phá danh sách địa điểm du lịch nổi bật trong và ngoài nước.",
};

type LocationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const locations = await getLocations(search || undefined);

  return (
    <div className="space-y-8 py-6">
      <SectionHeading
        eyebrow="Điểm đến"
        title="Danh sách địa điểm du lịch nổi bật"
        description="Tìm địa điểm theo tên thành phố hoặc khu vực để xem các tour liên quan."
      />

      <form className="rounded-2xl border bg-card p-4">
        <label htmlFor="search" className="mb-2 block text-xs font-medium text-muted-foreground">
          Tìm kiếm địa điểm
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Ví dụ: Đà Nẵng, Phú Quốc, Sa Pa..."
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tìm kiếm
          </button>
        </div>
      </form>

      {locations.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không tìm thấy địa điểm"
          description="Hãy thử từ khóa khác để tìm địa điểm phù hợp."
          ctaHref="/dia-diem"
          ctaLabel="Xem tất cả địa điểm"
        />
      )}
    </div>
  );
}
