import Image from "next/image";
import Link from "next/link";
import { HomeSectionHeading } from "@/components/home/home-section-heading";

type HomeReview = {
  id: string;
  rating: number;
  comment: string;
  user: {
    fullName: string;
    avatarUrl: string | null;
  };
  tour: {
    title: string;
    slug: string;
    location: {
      name: string;
    };
  };
};

type HomeTestimonialsProps = {
  reviews: HomeReview[];
};

const fallbackAvatars = [
  "/immerse-vietnam/images/test-1.jpg",
  "/immerse-vietnam/images/test-2.jpg",
  "/immerse-vietnam/images/test-3.jpg",
];

export function HomeTestimonials({ reviews }: HomeTestimonialsProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <HomeSectionHeading
          eyebrow="Khách hàng nói gì"
          title="Khách hàng nói gì về chuyến đi"
          description="Đánh giá được hiển thị từ dữ liệu người dùng và tour thực tế để giữ độ tin cậy."
        />
        <Link href="/reviews" className="iv-btn-soft inline-flex h-10 items-center px-4 text-sm font-semibold">
          Xem tất cả đánh giá
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reviews.slice(0, 6).map((review, index) => (
          <article key={review.id} className="iv-card flex h-full flex-col p-5">
            <p className="text-amber-500">{`${"★".repeat(Math.max(review.rating, 1))}${"☆".repeat(5 - Math.max(review.rating, 1))}`}</p>
            <p className="mt-3 line-clamp-5 text-sm leading-7 text-slate-600">
              &ldquo;{review.comment}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
              <div className="relative h-11 w-11 overflow-hidden rounded-full border border-slate-200">
                <Image
                  src={review.user.avatarUrl || fallbackAvatars[index % fallbackAvatars.length]}
                  alt={review.user.fullName}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{review.user.fullName}</p>
                <p className="text-xs text-slate-500">
                  {review.tour.location.name} -{" "}
                  <Link href={`/tours/${review.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                    {review.tour.title}
                  </Link>
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
