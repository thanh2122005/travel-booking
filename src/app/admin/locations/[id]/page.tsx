import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { AdminLocationContentForm } from "@/components/admin/admin-location-content-form";
import { AdminLocationGalleryManager } from "@/components/admin/admin-location-gallery-manager";
import { Badge } from "@/components/ui/badge";
import { getAdminLocationDetail } from "@/lib/db/admin-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminLocationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminLocationDetailPage({ params }: AdminLocationDetailPageProps) {
  const { id } = await params;
  const location = await getAdminLocationDetail(id).catch(() => null);

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <Link
        href="/admin/locations"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách điểm đến
      </Link>

      <section className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Quản lý chi tiết điểm đến
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{location.name}</h1>
            <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-teal-600" />
              {location.provinceOrCity}, {location.country}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex flex-wrap justify-end gap-2">
              {location.featured ? <Badge variant="default">Nổi bật</Badge> : <Badge variant="outline">Tiêu chuẩn</Badge>}
              <Badge variant="outline">{location._count.tours} tour</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Đơn: {location._count.bookings} · Đánh giá: {location._count.reviews} · Yêu thích:{" "}
              {location._count.favorites}
            </p>
            <p className="text-xs text-slate-500">Cập nhật: {formatDate(location.updatedAt)}</p>
          </div>
        </div>
      </section>

      <AdminLocationContentForm location={location} />
      <AdminLocationGalleryManager
        locationId={location.id}
        imageUrl={location.imageUrl}
        gallery={location.gallery}
      />

      <section className="space-y-3 rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Tour thuộc điểm đến này ({location.tours.length})
          </h2>
        </div>

        {location.tours.length ? (
          <div className="grid gap-3">
            {location.tours.map((tour) => (
              <article
                key={tour.id}
                className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_auto]"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{tour.title}</p>
                  <p className="text-xs text-slate-500">
                    {tour.durationDays}N{tour.durationNights}Đ ·{" "}
                    {formatPrice(tour.discountPrice ?? tour.price)} · Cập nhật {formatDate(tour.updatedAt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Đơn: {tour._count.bookings} · Đánh giá: {tour._count.reviews} · Yêu thích:{" "}
                    {tour._count.favorites}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <Badge variant={tour.status === "ACTIVE" ? "default" : "destructive"}>
                    {tour.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </Badge>
                  <Link
                    href={`/admin/tours/${tour.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Mở tour
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            Điểm đến này chưa có tour nào.
          </p>
        )}
      </section>
    </div>
  );
}
