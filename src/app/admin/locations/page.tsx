import Link from "next/link";
import { AdminCreateLocationForm } from "@/components/admin/admin-create-location-form";
import { AdminLocationActions } from "@/components/admin/admin-location-actions";
import { SafeImage } from "@/components/common/safe-image";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { getAdminLocations } from "@/lib/db/admin-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminLocationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function AdminLocationsPage({ searchParams }: AdminLocationsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const page = Number(normalizeParam(params.page) || "1");

  const data = await getAdminLocations({
    search: search || undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 12,
  }).catch(() => null);

  if (!data) {
    return (
      <EmptyState
        title="Không thể tải danh sách điểm đến"
        description="Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
        ctaHref="/admin/locations"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý điểm đến</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi mức độ nổi bật và số tour đang gắn với từng địa điểm.</p>
      </div>

      <form className="iv-card p-4">
        <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm kiếm điểm đến
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Tên, slug hoặc tỉnh/thành..."
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            Tìm kiếm
          </button>
        </div>
      </form>

      <AdminCreateLocationForm />

      {data.items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((location) => (
              <article key={location.id} className="iv-card overflow-hidden">
                <div className="relative h-44">
                  <SafeImage src={location.imageUrl} alt={location.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{location.provinceOrCity}</p>
                  <Link href={`/destinations/${location.slug}`} className="text-lg font-semibold text-slate-900 hover:text-teal-700">
                    {location.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    {location.featured ? <Badge variant="default">Nổi bật</Badge> : <Badge variant="outline">Thường</Badge>}
                    <Badge variant="outline">{location._count.tours} tour</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{location.shortDescription}</p>
                  <p className="text-xs text-slate-500">Cập nhật: {formatDate(location.updatedAt)}</p>
                  <AdminLocationActions locationId={location.id} featured={location.featured} />
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} điểm đến
            </p>
            <div className="flex gap-2">
              <Link
                href={{
                  pathname: "/admin/locations",
                  query: {
                    ...params,
                    page: String(Math.max(data.page - 1, 1)),
                  },
                }}
                className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
              >
                Trang trước
              </Link>
              <Link
                href={{
                  pathname: "/admin/locations",
                  query: {
                    ...params,
                    page: String(Math.min(data.page + 1, data.totalPages)),
                  },
                }}
                className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
              >
                Trang sau
              </Link>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Không có điểm đến phù hợp"
          description="Hãy thử từ khóa khác để tìm kiếm."
          ctaHref="/admin/locations"
          ctaLabel="Xóa bộ lọc"
        />
      )}
    </div>
  );
}
