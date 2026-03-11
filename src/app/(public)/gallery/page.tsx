import Image from "next/image";
import Link from "next/link";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { SafeImage } from "@/components/common/safe-image";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getLocations } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

const fallbackGalleryImages = [
  "/immerse-vietnam/images/gallery1.jpg",
  "/immerse-vietnam/images/gallery2.webp",
  "/immerse-vietnam/images/gallery3.jpg",
  "/immerse-vietnam/images/gallery4.jpg",
  "/immerse-vietnam/images/gallery5.jpg",
  "/immerse-vietnam/images/gallery6.jpg",
  "/immerse-vietnam/images/gallery7.jpg",
  "/immerse-vietnam/images/gallery8.jpg",
  "/immerse-vietnam/images/HoiAn/hoiancover.jpg",
];

export default async function GalleryPage() {
  const locations = await getLocations().catch(() => []);
  const galleryImages = Array.from(
    new Set(
      locations
        .flatMap((location) => [location.imageUrl, ...(Array.isArray(location.gallery) ? location.gallery : [])])
        .filter((image): image is string => Boolean(image))
        .concat(fallbackGalleryImages),
    ),
  ).slice(0, 18);

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="ThÆ° viá»‡n"
        title="Viá»‡t Nam qua lÄƒng kÃ­nh cáº£m xÃºc"
        description="Trang gallery Ä‘Æ°á»£c convert tá»« template cÅ©, giá»¯ bá»‘ cá»¥c áº£nh lá»›n vÃ  bá»• sung highlight theo dá»¯ liá»‡u location."
        videoSrc="/immerse-vietnam/videos/blogcover.mp4"
      />

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Khoáº£nh kháº¯c"
          title="Bá»™ sÆ°u táº­p hÃ¬nh áº£nh du lá»‹ch"
          description="áº¢nh Ä‘Æ°á»£c láº¥y trá»±c tiáº¿p tá»« dá»¯ liá»‡u Ä‘iá»ƒm Ä‘áº¿n vÃ  há»‡ asset public/immerse-vietnam Ä‘á»ƒ luÃ´n hiá»ƒn thá»‹ á»•n Ä‘á»‹nh."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((src, index) => (
            <article key={src} className="group iv-card overflow-hidden">
              <div className="relative h-64">
                <Image
                  src={src}
                  alt={`Vietnam gallery ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Äá»‹a Ä‘iá»ƒm ná»•i báº­t"
          title="Äiá»ƒm Ä‘áº¿n Ä‘ang Ä‘Æ°á»£c quan tÃ¢m"
          description="Thay cho danh sÃ¡ch tÃ­ch há»£p tay trong template, dá»¯ liá»‡u nÃ y map theo model Location."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.slice(0, 6).map((location) => (
            <article key={location.id} className="iv-card overflow-hidden">
              <Link href={`/dia-diem/${location.slug}`} className="group block">
                <div className="relative h-56">
                  <SafeImage
                    src={location.imageUrl}
                    alt={location.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{location.provinceOrCity}</p>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">{location.name}</h3>
                  <p className="line-clamp-3 text-sm leading-7 text-slate-600">{location.shortDescription}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

