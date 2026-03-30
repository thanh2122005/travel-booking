import Link from "next/link";
import { AdminCreateLocationForm } from "@/components/admin/admin-create-location-form";
import { AdminLocationActions } from "@/components/admin/admin-location-actions";
import { SafeImage } from "@/components/common/safe-image";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
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
  const hasActiveFilters = Boolean(search);

  let data: Awaited<ReturnType<typeof getAdminLocations>> | null = null;
  let loadFailed = false;

  try {
    data = await getAdminLocations({
    search: search || undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 12,
  });
  } catch {
    loadFailed = true;
  }

  if (!data) {
    return (
      <EmptyState
        title={loadFailed ? "Không thể tải danh sách điểm đến" : "Dữ liệu điểm đến chưa sẵn sàng"}
        description={loadFailed ? "Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại." : "Hiện chưa có dữ liệu để hiển thị trên trang này."}
        ctaHref="/admin/locations"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="iv-card p-5">
        <h1 className="iv-admin-page-title">Quản lý điểm đến</h1>
        <p className="iv-admin-page-subtitle">Theo dõi mức độ nổi bật và số tour đang gắn với từng địa điểm.</p>
      </div>

      <form id="bo-loc-dia-diem-admin" className="iv-admin-filter-form">
        <input type="hidden" name="page" value="1" />
        <label htmlFor="search" className="iv-admin-filter-title">
          Tìm kiếm điểm đến
        </label>
        <div className="iv-admin-filter-grid">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Tên, slug hoặc tỉnh/thành..."
            className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm sm:col-span-2 xl:col-span-2 focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="iv-btn-primary inline-flex h-10 w-full items-center justify-center px-5 text-sm font-semibold sm:w-auto">
            Tìm kiếm
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/locations"
              className="iv-btn-soft inline-flex h-10 w-full items-center justify-center px-4 text-sm font-semibold sm:w-auto"
            >
              Xóa bộ lọc
            </Link>
          ) : null}
        </div>
      </form>

      <AdminCreateLocationForm />

      <div id="danh-sach-dia-diem-admin" className="scroll-mt-24" />
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
                  <Link href={`/dia-diem/${location.slug}`} className="text-lg font-semibold text-slate-900 hover:text-teal-700">
                    {location.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    {location.featured ? <Badge variant="default">Nổi bật</Badge> : <Badge variant="outline">Thường</Badge>}
                    <Badge variant="outline">{location._count.tours} tour</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{location.shortDescription}</p>
                  <p className="text-xs text-slate-500">Cập nhật: {formatDate(location.updatedAt)}</p>
                  <Link
                    href={`/admin/locations/${location.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Quản lý chi tiết
                  </Link>
                  <AdminLocationActions locationId={location.id} featured={location.featured} />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/85 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} điểm đến
            </p>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              {data.page > 1 ? (
                <Link
                  href={{
                    pathname: "/admin/locations",
                    query: {
                      ...params,
                      page: String(data.page - 1),
                    },
                  }}
                  className="iv-btn-soft inline-flex h-9 w-full items-center justify-center px-3 text-sm font-semibold sm:w-auto"
                >
                  Trang trước
                </Link>
              ) : (
                <span className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400 sm:w-auto">
                  Trang trước
                </span>
              )}
              {data.page < data.totalPages ? (
                <Link
                  href={{
                    pathname: "/admin/locations",
                    query: {
                      ...params,
                      page: String(data.page + 1),
                    },
                  }}
                  className="iv-btn-soft inline-flex h-9 w-full items-center justify-center px-3 text-sm font-semibold sm:w-auto"
                >
                  Trang sau
                </Link>
              ) : (
                <span className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400 sm:w-auto">
                  Trang sau
                </span>
              )}
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

      <MobileQuickActions
        items={[
          { href: "#bo-loc-dia-diem-admin", label: "Bộ lọc" },
          { href: "#danh-sach-dia-diem-admin", label: "Danh sách", active: true },
          { href: "/admin/tours", label: "Tour" },
        ]}
      />
    </div>
  );
}

