import Link from "next/link";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { TourCard } from "@/components/tour/tour-card";

type FeaturedTour = Parameters<typeof TourCard>[0]["tour"];

type HomeFeaturedToursProps = {
  tours: FeaturedTour[];
};

export function HomeFeaturedTours({ tours }: HomeFeaturedToursProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <HomeSectionHeading
          eyebrow="Tour nổi bật"
          title="Hành trình được đặt nhiều"
          description="Thẻ tour lấy trực tiếp từ dữ liệu tour và điểm đánh giá, giúp bạn chọn hành trình nhanh và rõ ràng."
        />
        <Link href="/tours" className="iv-btn-soft inline-flex h-10 items-center px-4 text-sm font-semibold">
          Xem tất cả tour
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tours.map((tour) => (
          <TourCard key={tour.slug} tour={tour} />
        ))}
      </div>
    </section>
  );
}
