import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { AdminItineraryManager } from "@/components/admin/admin-itinerary-manager";
import { AdminTourContentForm } from "@/components/admin/admin-tour-content-form";
import { AdminTourImagesManager } from "@/components/admin/admin-tour-images-manager";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { Badge } from "@/components/ui/badge";
import { getAdminLocationOptions, getAdminTourDetail } from "@/lib/db/admin-queries";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminTourDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminTourDetailPage({ params }: AdminTourDetailPageProps) {
  const { id } = await params;
  const [tour, locationOptions] = await Promise.all([
    getAdminTourDetail(id).catch(() => null),
    getAdminLocationOptions().catch(() => []),
  ]);

  if (!tour) {
    notFound();
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <Link
        href="/admin/tours"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách tour
      </Link>

      <section className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Quản lý chi tiết tour
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{tour.title}</h1>
            <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-teal-600" />
              {tour.location.name}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-sm text-slate-600">
              Giá hiện tại:{" "}
              <span className="font-semibold text-slate-900">
                {formatPrice(tour.discountPrice ?? tour.price)}
              </span>
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant={tour.status === "ACTIVE" ? "default" : "destructive"}>
                {tour.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
              </Badge>
              {tour.featured ? <Badge variant="outline">Nổi bật</Badge> : null}
            </div>
            <p className="text-xs text-slate-500">
              Đơn: {tour._count.bookings} · Đánh giá: {tour._count.reviews} · Yêu thích:{" "}
              {tour._count.favorites}
            </p>
          </div>
        </div>
      </section>

      <div id="noi-dung-tour-admin" className="scroll-mt-24">
        <AdminTourContentForm tour={tour} locations={locationOptions} />
      </div>
      <div id="anh-tour-admin" className="scroll-mt-24">
        <AdminTourImagesManager tourId={tour.id} images={tour.images} />
      </div>
      <div id="lich-trinh-tour-admin" className="scroll-mt-24">
        <AdminItineraryManager tourId={tour.id} itineraries={tour.itineraries} />
      </div>

      <MobileQuickActions
        items={[
          { href: "#noi-dung-tour-admin", label: "Nội dung" },
          { href: "#anh-tour-admin", label: "Hình ảnh", active: true },
          { href: "#lich-trinh-tour-admin", label: "Lịch trình" },
        ]}
      />
    </div>
  );
}
