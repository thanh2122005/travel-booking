import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, MapPin, Plane, Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SectionHeading } from "@/components/common/section-heading";
import { TourBookingCard } from "@/components/tour/tour-booking-card";
import { TourCard } from "@/components/tour/tour-card";
import { StarRating } from "@/components/tour/star-rating";
import { getTourBySlug } from "@/lib/db/public-queries";
import { formatDate, formatDuration, getTourDisplayPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type TourDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TourDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTourBySlug(slug).catch(() => null);

  if (!data) {
    return {
      title: "KhÃ´ng tÃ¬m tháº¥y tour",
    };
  }

  return {
    title: data.tour.title,
    description: data.tour.shortDescription,
  };
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const data = await getTourBySlug(slug).catch(() => null);

  if (!data) {
    notFound();
  }

  const { tour, relatedTours } = data;
  const finalPrice = getTourDisplayPrice(tour.price, tour.discountPrice);

  return (
    <div className="space-y-10 py-6">
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Trang chá»§
          </Link>{" "}
          /{" "}
          <Link href="/tours" className="hover:text-primary">
            Tour du lá»‹ch
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
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px] xl:gap-8">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="relative h-[380px] overflow-hidden rounded-3xl border shadow-sm">
              <Image
                src={tour.featuredImage}
                alt={tour.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 70vw"
                priority
              />
            </div>
            {tour.images.length ? (
              <div className="grid grid-cols-3 gap-3">
                {tour.images.slice(0, 3).map((item) => (
                  <div key={item.id} className="relative h-28 overflow-hidden rounded-2xl border">
                    <Image
                      src={item.imageUrl}
                      alt={`HÃ¬nh áº£nh tour ${tour.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 20vw"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <article className="space-y-4 rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-bold">Tá»•ng quan tour</h2>
            <p className="text-sm leading-7 text-muted-foreground">{tour.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Clock3 className="h-4 w-4 text-primary" />
                {formatDuration(tour.durationDays, tour.durationNights)}
              </p>
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                Tá»‘i Ä‘a {tour.maxGuests} khÃ¡ch
              </p>
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Plane className="h-4 w-4 text-primary" />
                {tour.transportation}
              </p>
              <p className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                Khá»Ÿi hÃ nh: {tour.departureLocation}
              </p>
            </div>
          </article>

          <article className="space-y-4 rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-bold">Lá»‹ch trÃ¬nh chi tiáº¿t</h2>
            <div className="space-y-3">
              {tour.itineraries.map((item) => (
                <div key={item.id} className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    NgÃ y {item.dayNumber}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="space-y-4 rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-bold">ÄÃ¡nh giÃ¡ tá»« khÃ¡ch hÃ ng</h2>
            {tour.reviews.length ? (
              <div className="space-y-3">
                {tour.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{review.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm font-medium">ÄÃ¡nh giÃ¡: {review.rating}/5</p>
                    <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="ChÆ°a cÃ³ Ä‘Ã¡nh giÃ¡"
                description="Tour nÃ y chÆ°a cÃ³ Ä‘Ã¡nh giÃ¡ hiá»ƒn thá»‹."
                ctaHref="/tours"
                ctaLabel="Xem tour khÃ¡c"
              />
            )}
          </article>
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <TourBookingCard
            tourId={tour.id}
            tourSlug={tour.slug}
            shortDescription={tour.shortDescription}
            unitPrice={finalPrice}
            originalPrice={tour.price}
            maxGuests={tour.maxGuests}
          />
        </aside>
      </section>

      <section className="space-y-5">
        <SectionHeading title="Tour liÃªn quan" description="Gá»£i Ã½ thÃªm cÃ¡c tour khÃ¡c cÃ¹ng Ä‘á»‹a Ä‘iá»ƒm." />
        {relatedTours.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {relatedTours.map((item) => (
              <TourCard key={item.id} tour={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="ChÆ°a cÃ³ tour liÃªn quan"
            description="Hiá»‡n chÆ°a cÃ³ tour cÃ¹ng Ä‘á»‹a Ä‘iá»ƒm Ä‘á»ƒ gá»£i Ã½."
            ctaHref="/tours"
            ctaLabel="Xem toÃ n bá»™ tour"
          />
        )}
      </section>
    </div>
  );
}

