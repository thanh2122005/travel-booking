import Link from "next/link";
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
};

type HomeItineraryPreviewProps = {
  tours: ItineraryPreviewTour[];
};

export function HomeItineraryPreview({ tours }: HomeItineraryPreviewProps) {
  return (
    <section className="space-y-5">
      <HomeSectionHeading
        eyebrow="Xem trước lịch trình"
        title="Xem nhanh lộ trình trước khi đặt"
        description="Mục này giúp bạn xem trước các chặng chính trước khi quyết định đặt tour."
      />

      {tours.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {tours.map((tour) => {
            const previewItems = tour.itineraries.slice(0, 4);
            const hiddenCount = Math.max(0, tour.itineraries.length - previewItems.length);

            return (
              <article key={tour.id} className="iv-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{tour.location.name}</p>
                    <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{tour.title}</h3>
                  </div>
                  <Link href={`/tours/${tour.slug}`} className="iv-btn-soft inline-flex h-9 items-center px-3 text-xs font-semibold">
                    Chi tiết
                  </Link>
                </div>

                {previewItems.length ? (
                  <div className="mt-4 space-y-2">
                    {previewItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ngày {item.dayNumber}</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">{item.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Tour này đang được cập nhật lịch trình chi tiết.
                  </p>
                )}

                {hiddenCount > 0 ? (
                  <div className="mt-3">
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
          description="Các tour có lịch trình chi tiết sẽ hiển thị tại đây để bạn tham khảo nhanh trước khi đặt."
          ctaHref="/tours"
          ctaLabel="Xem danh sách tour"
        />
      )}
    </section>
  );
}
