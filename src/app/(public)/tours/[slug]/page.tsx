import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, MapPin, Plane, Star, Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SectionHeading } from "@/components/common/section-heading";
import { TourBookingCard } from "@/components/tour/tour-booking-card";
import { TourCard } from "@/components/tour/tour-card";
import { TourImageGallery } from "@/components/tour/tour-image-gallery";
import { StarRating } from "@/components/tour/star-rating";
import { getAuthSession } from "@/lib/auth/session";
import { getTourBySlug } from "@/lib/db/public-queries";
import { formatDate, formatDuration, formatPrice, getTourDisplayPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type TourDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TourDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTourBySlug(slug).catch(() => null);

  if (!data) {
    return {
      title: "Không tìm thấy tour",
    };
  }

  return {
    title: data.tour.title,
    description: data.tour.shortDescription,
  };
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const session = await getAuthSession();
  const data = await getTourBySlug(slug, session?.user?.id).catch(() => null);

  if (!data) {
    notFound();
  }

  const { tour, relatedTours, viewer } = data;
  const finalPrice = getTourDisplayPrice(tour.price, tour.discountPrice);
  const dedicatedImages = Array.from(
    new Set(
      [tour.featuredImage, ...tour.images.map((item) => item.imageUrl)].filter(
        (image): image is string => Boolean(image && image.trim()),
      ),
    ),
  );
  const locationImages = Array.from(
    new Set(
      [tour.location.imageUrl, ...tour.location.gallery].filter(
        (image): image is string => Boolean(image && image.trim()),
      ),
    ),
  );
  const galleryImages = Array.from(new Set([...dedicatedImages, ...locationImages]));

  const reviewCount = tour.reviews.length;
  const averageRating = reviewCount
    ? Number((tour.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1))
    : 0;
  const quickConsultHref = `/lien-he?tourId=${encodeURIComponent(tour.id)}&tourName=${encodeURIComponent(
    tour.title,
  )}&locationName=${encodeURIComponent(tour.location.name)}`;
  const ratingRows = [5, 4, 3, 2, 1].map((rating) => {
    const count = tour.reviews.filter((review) => review.rating === rating).length;
    const percent = reviewCount ? (count / reviewCount) * 100 : 0;
    return { rating, count, percent };
  });
  const visibleReviews = tour.reviews.slice(0, 8);
  const hasMoreReviews = tour.reviews.length > visibleReviews.length;

  return (
    <div className="space-y-10 py-6 pb-24 lg:pb-6">
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>{" "}
          /{" "}
          <Link href="/tours" className="hover:text-primary">
            Tour du lịch
          </Link>{" "}
          / {tour.title}
        </p>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">{tour.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {tour.location.name}
            </span>
            <StarRating rating={tour.avgRating} reviewCount={tour.reviewCount} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Giá hiện tại</p>
            <p className="mt-2 text-xl font-black text-primary">{formatPrice(finalPrice)}</p>
            {tour.discountPrice ? (
              <p className="text-xs text-slate-500 line-through">{formatPrice(tour.price)}</p>
            ) : null}
          </article>
          <article className="rounded-2xl border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Thời lượng</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{formatDuration(tour.durationDays, tour.durationNights)}</p>
          </article>
          <article className="rounded-2xl border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Sức chứa</p>
            <p className="mt-2 text-base font-semibold text-slate-900">Tối đa {tour.maxGuests} khách/đơn</p>
          </article>
          <article className="rounded-2xl border bg-card p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Điểm trung bình</p>
            <p className="mt-2 inline-flex items-center gap-1 text-base font-semibold text-slate-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {averageRating}/5
            </p>
            <p className="text-xs text-slate-500">{reviewCount} đánh giá</p>
          </article>
        </div>

        <nav className="flex flex-wrap gap-2 rounded-xl border bg-card p-3 text-sm">
          <a href="#tong-quan" className="inline-flex h-8 items-center rounded-md border px-3 font-medium hover:bg-muted">
            Tổng quan
          </a>
          <a href="#lich-trinh" className="inline-flex h-8 items-center rounded-md border px-3 font-medium hover:bg-muted">
            Lịch trình
          </a>
          <a href="#danh-gia" className="inline-flex h-8 items-center rounded-md border px-3 font-medium hover:bg-muted">
            Đánh giá
          </a>
          <a href="#dat-tour" className="inline-flex h-8 items-center rounded-md border px-3 font-medium hover:bg-muted">
            Đặt tour
          </a>
          <a href="#lien-quan" className="inline-flex h-8 items-center rounded-md border px-3 font-medium hover:bg-muted">
            Tour liên quan
          </a>
        </nav>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px] xl:gap-8">
        <div className="space-y-8">
          <TourImageGallery title={tour.title} images={galleryImages} />

          <article id="tong-quan" className="space-y-4 rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-bold">Tổng quan tour</h2>
            <p className="text-sm leading-7 text-muted-foreground">{tour.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Clock3 className="h-4 w-4 text-primary" />
                {formatDuration(tour.durationDays, tour.durationNights)}
              </p>
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                Tối đa {tour.maxGuests} khách
              </p>
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Plane className="h-4 w-4 text-primary" />
                {tour.transportation}
              </p>
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                Khởi hành: {tour.departureLocation}
              </p>
            </div>
          </article>

          <article id="lich-trinh" className="space-y-4 rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-bold">Lịch trình chi tiết</h2>
            <div className="space-y-3">
              {tour.itineraries.map((item) => (
                <div key={item.id} className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    Ngày {item.dayNumber}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article id="danh-gia" className="space-y-4 rounded-3xl border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Đánh giá từ khách hàng</h2>
              {reviewCount ? (
                <BadgeReviewSummary averageRating={averageRating} reviewCount={reviewCount} />
              ) : null}
            </div>

            {reviewCount ? (
              <>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-slate-900">Phân bố điểm đánh giá</p>
                  <div className="mt-3 space-y-2">
                    {ratingRows.map((row) => (
                      <div key={row.rating} className="flex items-center gap-2 text-xs">
                        <span className="w-10 font-medium text-slate-700">{row.rating} sao</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(row.percent, row.count ? 5 : 0)}%` }} />
                        </div>
                        <span className="w-8 text-right text-slate-500">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {visibleReviews.map((review) => (
                    <div key={review.id} className="rounded-xl border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{review.user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                      </div>
                      <p className="mt-1 text-sm font-medium">Đánh giá: {review.rating}/5</p>
                      <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>

                {hasMoreReviews ? (
                  <Link
                    href={{ pathname: "/reviews", query: { search: tour.title } }}
                    className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    Xem thêm đánh giá liên quan
                  </Link>
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Chưa có đánh giá"
                description="Tour này chưa có đánh giá hiển thị."
                ctaHref="/tours"
                ctaLabel="Xem tour khác"
              />
            )}
          </article>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <article className="rounded-2xl border bg-card p-4">
            <p className="text-sm font-semibold text-slate-900">Cần tư vấn nhanh?</p>
            <p className="mt-1 text-xs leading-6 text-slate-600">
              Đội ngũ tư vấn sẽ chuẩn bị phương án phù hợp theo tour bạn đang xem.
            </p>
            <Link
              href={quickConsultHref}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
            >
              Điền form tư vấn tour này
            </Link>
          </article>
          <div id="dat-tour" className="scroll-mt-24">
            <TourBookingCard
              tourId={tour.id}
              tourSlug={tour.slug}
              shortDescription={tour.shortDescription}
              unitPrice={finalPrice}
              originalPrice={tour.price}
              maxGuests={tour.maxGuests}
              initialIsFavorite={viewer?.isFavorite ?? false}
              initialReview={viewer?.review ?? null}
              initialPhone={viewer?.phone ?? ""}
            />
          </div>
        </aside>
      </section>

      <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">
        <a
          href="#dat-tour"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Đặt tour
        </a>
        <Link
          href={quickConsultHref}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
        >
          Tư vấn nhanh
        </Link>
      </div>

      <section id="lien-quan" className="space-y-5">
        <SectionHeading title="Tour liên quan" description="Gợi ý thêm các tour khác cùng điểm đến." />
        {relatedTours.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {relatedTours.map((item) => (
              <TourCard key={item.id} tour={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có tour liên quan"
            description="Hiện chưa có tour cùng điểm đến để gợi ý."
            ctaHref="/tours"
            ctaLabel="Xem toàn bộ tour"
          />
        )}
      </section>
    </div>
  );
}

function BadgeReviewSummary({ averageRating, reviewCount }: { averageRating: number; reviewCount: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
      <Star className="h-4 w-4 fill-current" />
      {averageRating}/5 · {reviewCount} đánh giá
    </div>
  );
}
