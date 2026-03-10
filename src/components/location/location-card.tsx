import Link from "next/link";
import { MapPin } from "lucide-react";
import { SafeImage } from "@/components/common/safe-image";

type LocationCardProps = {
  location: {
    slug: string;
    name: string;
    provinceOrCity: string;
    country: string;
    shortDescription: string;
    imageUrl: string;
  };
};

export function LocationCard({ location }: LocationCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/destinations/${location.slug}`} className="relative block h-52 overflow-hidden">
        <SafeImage
          src={location.imageUrl}
          alt={location.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>
      <div className="space-y-3 p-5">
        <Link href={`/destinations/${location.slug}`}>
          <h3 className="text-xl font-semibold transition-colors hover:text-primary">{location.name}</h3>
        </Link>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {location.provinceOrCity}, {location.country}
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{location.shortDescription}</p>
        <Link
          href={`/destinations/${location.slug}`}
          className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
        >
          Khám phá địa điểm
        </Link>
      </div>
    </article>
  );
}
