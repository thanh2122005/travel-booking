import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { AdminItineraryManager } from "@/components/admin/admin-itinerary-manager";
import { AdminTourContentForm } from "@/components/admin/admin-tour-content-form";
import { AdminTourImagesManager } from "@/components/admin/admin-tour-images-manager";
import { EmptyState } from "@/components/common/empty-state";
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
  let tour: Awaited<ReturnType<typeof getAdminTourDetail>> | null = null;
  let locationOptions: Awaited<ReturnType<typeof getAdminLocationOptions>> = [];
  let loadFailed = false;

  try {
    [tour, locationOptions] = await Promise.all([
      getAdminTourDetail(id),
      getAdminLocationOptions(),
    ]);
  } catch {
    loadFailed = true;
  }

  if (loadFailed) {
    return (
      <EmptyState
        title="Không thể tải dữ liệu tour"
        description="Vui lòng thử lại sau hoặc quay lại danh sách tour quản trị."
        ctaHref="/admin/tours"
        ctaLabel="Quay lại danh sách tour"
      />
    );
  }

  if (!tour) {
    notFound();
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <Link
        href="/admin/tours"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách tour
      </Link>

      <section className="iv-card rounded-2xl border-slate-200/80 bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Quản lý chi tiết tour
            </p>
            <h1 className="iv-admin-page-title">{tour.title}</h1>
            <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-teal-600" />
              {tour.location.name}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              Giá hiện tại:{" "}
              <span className="font-semibold text-slate-900">
                {formatPrice(tour.discountPrice ?? tour.price)}
              </span>
            </p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge variant={tour.status === "ACTIVE" ? "default" : "destructive"}>
                {tour.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
              </Badge>
              {tour.featured ? <Badge variant="outline">Nổi bật</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-1.5 lg:justify-end">
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Đơn {tour._count.bookings}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Đánh giá {tour._count.reviews}
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Yêu thích {tour._count.favorites}
              </span>
            </div>
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