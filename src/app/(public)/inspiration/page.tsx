import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { SafeImage } from "@/components/common/safe-image";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getLocations } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export default async function InspirationPage() {
  const locations = await getLocations().catch(() => []);

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Cáº£m há»©ng"
        title="Cáº£m há»©ng du lá»‹ch Viá»‡t Nam"
        description="Chuyá»ƒn Ä‘á»•i trang blog tÄ©nh trong template thÃ nh trang truyá»n cáº£m há»©ng cÃ³ route dynamic vÃ  kháº£ nÄƒng map dá»¯ liá»‡u tháº­t."
        videoSrc="/immerse-vietnam/videos/vietnamBlog.mp4"
      />

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="CÃ¢u chuyá»‡n"
          title="Nhá»¯ng hÃ nh trÃ¬nh Ä‘ang truyá»n cáº£m há»©ng"
          description="Blog khÃ´ng cÃ²n lÃ  static html; má»—i bÃ i viáº¿t hÆ°á»›ng Ä‘áº¿n destination detail vÃ  luá»“ng Ä‘áº·t tour."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.slice(0, 6).map((location, index) => (
            <article key={location.id} className="iv-card overflow-hidden">
              <Link href={`/dia-diem/${location.slug}`} className="group block">
                <div className="relative h-52">
                  <SafeImage
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
                    {new Date(2026, 5, 3 + index).toLocaleDateString("vi-VN")}
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

