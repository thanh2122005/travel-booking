import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { AdminLocationContentForm } from "@/components/admin/admin-location-content-form";
import { AdminLocationGalleryManager } from "@/components/admin/admin-location-gallery-manager";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { Badge } from "@/components/ui/badge";
import { getAdminLocationDetail } from "@/lib/db/admin-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminLocationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminLocationDetailPage({ params }: AdminLocationDetailPageProps) {
  const { id } = await params;
  let location: Awaited<ReturnType<typeof getAdminLocationDetail>> | null = null;
  let loadFailed = false;

  try {
    location = await getAdminLocationDetail(id);
  } catch {
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <EmptyState
        title="Không thể tải dữ liệu điểm đến"
        description="Vui lòng thử lại sau hoặc quay lại danh sách điểm đến."
        ctaHref="/admin/locations"
        ctaLabel="Quay lại danh sách điểm đến"
      />
    );
  }

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <Link
        href="/admin/locations"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách điểm đến
      </Link>

      <section className="iv-card rounded-2xl border-slate-200/80 bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Quản lý chi tiết điểm đến
            </p>
            <h1 className="iv-admin-page-title">{location.name}</h1>
            <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-teal-600" />
              {location.provinceOrCity}, {location.country}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {location.featured ? <Badge variant="default">Nổi bật</Badge> : <Badge variant="outline">Tiêu chuẩn</Badge>}
              <Badge variant="outline">{location._count.tours} tour</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 lg:justify-end">
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Đơn {location._count.bookings}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Đánh giá {location._count.reviews}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Yêu thích {location._count.favorites}
              </span>
            </div>
            <p className="text-xs text-slate-500">Cập nhật: {formatDate(location.updatedAt)}</p>
          </div>
        </div>
      </section>

      <div id="noi-dung-dia-diem-admin" className="scroll-mt-24">
        <AdminLocationContentForm location={{ ...location, gallery: Array.isArray(location.gallery) ? location.gallery as string[] : [] }} />
      </div>
      <div id="gallery-dia-diem-admin" className="scroll-mt-24">
        <AdminLocationGalleryManager
          locationId={location.id}
          imageUrl={location.imageUrl}
          gallery={Array.isArray(location.gallery) ? location.gallery as string[] : []}
        />
      </div>

      <section id="tour-dia-diem-admin" className="iv-card space-y-3 scroll-mt-24 rounded-2xl border-slate-200/80 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-700">
            Tour thuộc điểm đến này ({location.tours.length})
          </h2>
        </div>

        {location.tours.length ? (
          <div className="grid gap-3">
            {location.tours.map((tour) => (
              <article
                key={tour.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/30 p-3 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700">{tour.title}</p>
                  <p className="text-xs text-slate-500">
                    {tour.durationDays}N{tour.durationNights}Đ · {formatPrice(tour.discountPrice ?? tour.price)} · Cập nhật {formatDate(tour.updatedAt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Đơn: {tour._count.bookings} · Đánh giá: {tour._count.reviews} · Yêu thích: {tour._count.favorites}
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

      <MobileQuickActions
        items={[
          { href: "#noi-dung-dia-diem-admin", label: "Nội dung" },
          { href: "#gallery-dia-diem-admin", label: "Gallery", active: true },
          { href: "#tour-dia-diem-admin", label: "Tour" },
        ]}
      />
    </div>
  );
}