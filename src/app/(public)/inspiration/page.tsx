import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getLocations } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export default async function InspirationPage() {
  const locations = await getLocations().catch(() => []);

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Inspiration"
        title="Travel Inspiration"
        description="Chuyển đổi trang blog tĩnh trong template thành trang truyền cảm hứng có route dynamic và khả năng map dữ liệu thật."
        videoSrc="/immerse-vietnam/videos/vietnamBlog.mp4"
      />

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Stories"
          title="Những hành trình đang truyền cảm hứng"
          description="Blog không còn là static html; mỗi bài viết hướng đến destination detail và luồng đặt tour."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.slice(0, 6).map((location, index) => (
            <article key={location.id} className="iv-card overflow-hidden">
              <Link href={`/destinations/${location.slug}`} className="group block">
                <div className="relative h-52">
                  <Image
                    src={location.imageUrl}
                    alt={location.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5 text-teal-600" />
                    {`Jun ${String(3 + index).padStart(2, "0")}, 2026`}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">
                    {location.name}: {location.shortDescription}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-7 text-slate-600">{location.description}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
