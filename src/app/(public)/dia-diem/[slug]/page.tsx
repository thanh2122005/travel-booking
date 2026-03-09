import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Compass, MapPin } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SectionHeading } from "@/components/common/section-heading";
import { TourCard } from "@/components/tour/tour-card";
import { getLocationBySlug } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

type LocationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LocationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug).catch(() => null);

  if (!location) {
    return {
      title: "Không tìm thấy địa điểm",
    };
  }

  return {
    title: location.name,
    description: location.shortDescription,
  };
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug).catch(() => null);

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-10 py-6">
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>{" "}
          /{" "}
          <Link href="/dia-diem" className="hover:text-primary">
            Địa điểm
          </Link>{" "}
          / {location.name}
        </p>
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">{location.name}</h1>
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {location.provinceOrCity}, {location.country}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="relative h-[380px] overflow-hidden rounded-3xl border shadow-sm">
            <Image
              src={location.imageUrl}
              alt={location.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          </div>
          <article className="space-y-4 rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-bold">Giới thiệu điểm đến</h2>
            <p className="text-sm leading-7 text-muted-foreground">{location.description}</p>
          </article>
        </div>

        <aside className="h-fit rounded-3xl border bg-card p-5 lg:sticky lg:top-24">
          <h3 className="text-lg font-semibold">Gợi ý nhanh</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Khám phá các tour nổi bật tại {location.name} và lên kế hoạch chuyến đi phù hợp.
          </p>
          <Link
            href="/tours"
            className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Xem tất cả tour
          </Link>
        </aside>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Tour liên quan"
          title={`Tour đang mở bán tại ${location.name}`}
          description="Các lựa chọn phù hợp để bạn dễ dàng đặt tour theo điểm đến yêu thích."
        />
        {location.tours.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {location.tours.map((tour) => (
              <TourCard key={tour.id} tour={{ ...tour, location }} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có tour phù hợp"
            description="Hiện chưa có tour đang mở bán cho địa điểm này."
            ctaHref="/tours"
            ctaLabel="Xem tour khác"
          />
        )}
      </section>

      <section className="rounded-3xl border bg-card p-6">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold">
          <Compass className="h-5 w-5 text-primary" />
          Gợi ý trải nghiệm
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Ưu tiên chuẩn bị lịch trình linh hoạt, đặt tour sớm và theo dõi thông tin thời tiết để có
          chuyến đi trọn vẹn hơn tại {location.name}.
        </p>
      </section>
    </div>
  );
}
