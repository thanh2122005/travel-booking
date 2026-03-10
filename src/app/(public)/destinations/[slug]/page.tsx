import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Compass, MapPin } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { TourCard } from "@/components/tour/tour-card";
import { getLocationBySlug } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

type DestinationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: DestinationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug).catch(() => null);

  if (!location) {
    return {
      title: "Khong tim thay diem den",
    };
  }

  return {
    title: location.name,
    description: location.shortDescription,
  };
}

export default async function DestinationDetailPage({ params }: DestinationDetailPageProps) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug).catch(() => null);

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <section className="iv-page-hero">
        <div className="absolute inset-0">
          <Image src={location.imageUrl} alt={location.name} fill className="object-cover opacity-80" sizes="100vw" priority />
        </div>
        <div className="relative px-5 py-16 md:px-8 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">Destination Detail</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">{location.name}</h1>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-100">
            <MapPin className="h-4 w-4 text-teal-200" />
            {location.provinceOrCity}, {location.country}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">{location.description}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="iv-card space-y-4 p-6">
          <HomeSectionHeading
            eyebrow="Highlights"
            title={`Vi sao nen den ${location.name}?`}
            description={location.shortDescription}
          />
          <p className="text-sm leading-7 text-slate-600">{location.description}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {location.gallery.slice(0, 3).map((image, index) => (
              <div key={`${image}-${index}`} className="relative h-32 overflow-hidden rounded-xl border border-slate-200">
                <Image src={image} alt={`${location.name} gallery ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 20vw" />
              </div>
            ))}
          </div>
        </article>

        <aside className="iv-card h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
          <p className="text-sm leading-7 text-slate-600">
            Xem danh sach tour dang mo ban tai {location.name} va dat tour ngay khi tim thay lich trinh phu hop.
          </p>
          <Link href="/tours" className="iv-btn-primary inline-flex h-10 w-full items-center justify-center text-sm font-semibold">
            Xem tat ca tours
          </Link>
          <Link href="/booking" className="iv-btn-soft inline-flex h-10 w-full items-center justify-center text-sm font-semibold">
            Di den trang booking
          </Link>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <Compass className="h-4 w-4 text-teal-600" />
              Goi y:
            </p>
            <p className="mt-2 leading-7">Dat som vao mua cao diem va uu tien lich trinh co itinerary ro rang de toi uu thoi gian.</p>
          </div>
        </aside>
      </section>

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Tours"
          title={`Tour dang mo tai ${location.name}`}
          description="Danh sach nay duoc map truc tiep tu model Tour theo locationId."
        />

        {location.tours.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {location.tours.map((tour) => (
              <TourCard key={tour.id} tour={{ ...tour, location }} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chua co tour phu hop"
            description="Hien chua co tour dang hoat dong cho diem den nay."
            ctaHref="/tours"
            ctaLabel="Xem cac tour khac"
          />
        )}
      </section>
    </div>
  );
}
