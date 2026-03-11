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
        eyebrow="Thư viện"
        title="Việt Nam qua lăng kính cảm xúc"
        description="Thư viện hình ảnh giúp bạn cảm nhận rõ hơn vẻ đẹp của từng điểm đến trước khi lên lịch trình."
        videoSrc="/immerse-vietnam/videos/blogcover.mp4"
      />

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Khoảnh khắc"
          title="Bộ sưu tập hình ảnh du lịch"
          description="Ảnh được lấy trực tiếp từ dữ liệu điểm đến và hệ asset public/immerse-vietnam để luôn hiển thị ổn định."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((src, index) => (
            <article key={src} className="group iv-card overflow-hidden">
              <div className="relative h-64">
                <Image
                  src={src}
                  alt={`Ảnh du lịch Việt Nam ${index + 1}`}
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
          eyebrow="Địa điểm nổi bật"
          title="Điểm đến đang được quan tâm"
          description="Danh sách địa điểm được cập nhật từ dữ liệu hệ thống để đảm bảo luôn nhất quán."
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

