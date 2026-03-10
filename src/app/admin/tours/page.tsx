import Link from "next/link";
import { AdminCreateTourForm } from "@/components/admin/admin-create-tour-form";
import { AdminTourActions } from "@/components/admin/admin-tour-actions";
import { SafeImage } from "@/components/common/safe-image";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { adminLabels, getAdminLocationOptions, getAdminTours } from "@/lib/db/admin-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminToursPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function AdminToursPage({ searchParams }: AdminToursPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const page = Number(normalizeParam(params.page) || "1");

  const data = await getAdminTours({
    search: search || undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 12,
  }).catch(() => null);
  const locationOptions = await getAdminLocationOptions().catch(() => []);

  if (!data) {
    return (
      <EmptyState
        title="Không thể tải danh sách tour"
        description="Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
        ctaHref="/admin/tours"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý tour</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi trạng thái mở bán, hiệu suất đặt tour và đánh giá.</p>
      </div>

      <form className="iv-card p-4">
        <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm kiếm tour
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Tên tour, slug hoặc điểm đến..."
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            Tìm kiếm
          </button>
        </div>
      </form>

      <AdminCreateTourForm locations={locationOptions} />

      {data.items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((tour) => (
              <article key={tour.id} className="iv-card overflow-hidden">
                <div className="relative h-44">
                  <SafeImage src={tour.featuredImage} alt={tour.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{tour.location.name}</p>
                  <Link href={`/tours/${tour.slug}`} className="line-clamp-2 text-lg font-semibold text-slate-900 hover:text-teal-700">
                    {tour.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={tour.status === "ACTIVE" ? "default" : "destructive"}>
                      {adminLabels.tourStatus[tour.status]}
                    </Badge>
                    {tour.featured ? <Badge variant="outline">Nổi bật</Badge> : null}
                  </div>
                  <p className="text-sm text-slate-600">
                    Giá: <span className="font-semibold">{formatPrice(tour.discountPrice ?? tour.price)}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Đặt tour: {tour._count.bookings} · Đánh giá: {tour._count.reviews} · Yêu thích: {tour._count.favorites}
                  </p>
                  <p className="text-xs text-slate-500">Cập nhật: {formatDate(tour.updatedAt)}</p>
                  <Link
                    href={`/admin/tours/${tour.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Quản lý ảnh & lịch trình
                  </Link>
                  <AdminTourActions tourId={tour.id} status={tour.status} featured={tour.featured} />
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} tour
            </p>
            <div className="flex gap-2">
              <Link
                href={{
                  pathname: "/admin/tours",
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
                  pathname: "/admin/tours",
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
          title="Không có tour phù hợp"
          description="Hãy thử từ khóa khác để tìm kiếm."
          ctaHref="/admin/tours"
          ctaLabel="Xóa bộ lọc"
        />
      )}
    </div>
  );
}
