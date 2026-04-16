import Link from "next/link";
import { Route } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";

type ItineraryPreviewTour = {
  id: string;
  title: string;
  slug: string;
  location: {
    name: string;
  };
  itineraries: Array<{
    id: string;
    dayNumber: number;
    title: string;
  }>;
  itineraryCount: number;
};

type HomeItineraryPreviewProps = {
  tours: ItineraryPreviewTour[];
};

export function HomeItineraryPreview({ tours }: HomeItineraryPreviewProps) {
  return (
    <section className="space-y-5">
      <HomeSectionHeading
        eyebrow="Gợi ý chuyến đi"
        title="Gợi ý lịch trình các tour nổi bật"
        description="Tham khảo nhanh các điểm dừng và hoạt động nổi bật từ lịch trình thật đang được quản lý trong cơ sở dữ liệu."
      />

      {tours.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {tours.map((tour) => {
            const previewItems = tour.itineraries.slice(0, 3);
            const hiddenCount = Math.max(0, tour.itineraryCount - previewItems.length);

            return (
              <article key={tour.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                      <Route className="h-3.5 w-3.5" />
                      {tour.location.name}
                    </p>
                    <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{tour.title}</h3>
                  </div>
                  <Link href={`/tours/${tour.slug}`} className="iv-btn-soft inline-flex h-9 items-center px-3 text-xs font-semibold">
                    Chi tiết
                  </Link>
                </div>

                {previewItems.length ? (
                  <div className="mt-4 space-y-2">
                    {previewItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ngày {item.dayNumber}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{item.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Tour này chưa có lịch trình chi tiết trong cơ sở dữ liệu.
                  </p>
                )}

                {hiddenCount > 0 ? (
                  <div className="mt-3 flex items-center justify-between">
                    <Link href={`/tours/${tour.slug}#lich-trinh`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                      Xem thêm {hiddenCount} ngày lịch trình
                    </Link>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Chưa có dữ liệu lịch trình"
          description="Chỉ những tour đã có lịch trình thật trong cơ sở dữ liệu mới hiển thị tại đây để bạn tham khảo nhanh."
          ctaHref="/tours"
          ctaLabel="Xem danh sách tour"
        />
      )}
    </section>
  );
}

