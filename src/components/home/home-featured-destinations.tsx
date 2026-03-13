import Link from "next/link";
import { MapPin } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SafeImage } from "@/components/common/safe-image";
import { HomeSectionHeading } from "@/components/home/home-section-heading";

type FeaturedLocation = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  imageUrl: string;
  provinceOrCity: string;
};

type HomeFeaturedDestinationsProps = {
  locations: FeaturedLocation[];
};

export function HomeFeaturedDestinations({ locations }: HomeFeaturedDestinationsProps) {
  return (
    <section className="space-y-5">
      <HomeSectionHeading
        eyebrow="Điểm đến nổi bật"
        title="Điểm đến nổi bật tại Việt Nam"
        description="Giữ bố cục ảnh lớn và lớp phủ nổi bật, đồng thời kết nối trực tiếp với dữ liệu điểm đến thực tế."
      />

      {locations.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <article key={location.id} className="group relative overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
              <Link href={`/dia-diem/${location.slug}`} className="absolute inset-0 z-20" aria-label={location.name} />
              <div className="relative h-[300px]">
                <SafeImage
                  src={location.imageUrl}
                  alt={location.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="iv-overlay-gradient absolute inset-0" />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 text-white">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] text-teal-100">
                  <MapPin className="h-3.5 w-3.5" />
                  {location.provinceOrCity}
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">{location.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">{location.shortDescription}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có điểm đến nổi bật"
          description="Dữ liệu điểm đến sẽ hiển thị tại đây khi hệ thống có đủ nội dung công khai."
          ctaHref="/dia-diem"
          ctaLabel="Xem danh sách điểm đến"
        />
      )}
    </section>
  );
}
