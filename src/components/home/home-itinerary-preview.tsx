import Link from "next/link";
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

      <div className="grid gap-4 lg:grid-cols-2">
        {tours.map((tour) => (
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

            <div className="mt-4 space-y-2">
              {tour.itineraries.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ngày {item.dayNumber}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{item.title}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
