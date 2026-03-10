import Link from "next/link";
import { Clock3, MapPin, Users } from "lucide-react";
import { SafeImage } from "@/components/common/safe-image";
import { getTourDisplayPrice, formatDuration, formatPrice } from "@/lib/utils/format";
import { StarRating } from "@/components/tour/star-rating";

type TourCardProps = {
  tour: {
    slug: string;
    title: string;
    shortDescription: string;
    featuredImage: string;
    price: number;
    discountPrice: number | null;
    durationDays: number;
    durationNights: number;
    maxGuests: number;
    location: {
      name: string;
    };
    avgRating: number;
    reviewCount: number;
  };
};

export function TourCard({ tour }: TourCardProps) {
  const finalPrice = getTourDisplayPrice(tour.price, tour.discountPrice);

  return (
    <article className="group overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/tours/${tour.slug}`} className="relative block h-52 overflow-hidden">
        <SafeImage
          src={tour.featuredImage}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>

      <div className="space-y-3 p-5">
        <StarRating rating={tour.avgRating} reviewCount={tour.reviewCount} />
        <Link href={`/tours/${tour.slug}`}>
          <h3 className="line-clamp-2 text-lg font-semibold transition-colors hover:text-primary">
            {tour.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{tour.shortDescription}</p>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {tour.location.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            {formatDuration(tour.durationDays, tour.durationNights)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            Tối đa {tour.maxGuests} khách
          </span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="text-xs text-muted-foreground">Giá từ</p>
            <p className="text-lg font-bold text-primary">{formatPrice(finalPrice)}</p>
            {tour.discountPrice ? (
              <p className="text-xs text-muted-foreground line-through">{formatPrice(tour.price)}</p>
            ) : null}
          </div>
          <Link
            href={`/tours/${tour.slug}`}
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}
