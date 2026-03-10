import Image from "next/image";
import Link from "next/link";
import { HomeSectionHeading } from "@/components/home/home-section-heading";

type InspirationLocation = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  shortDescription: string;
};

type HomeInspirationProps = {
  locations: InspirationLocation[];
};

export function HomeInspiration({ locations }: HomeInspirationProps) {
  const stories = locations.slice(0, 3).map((location) => ({
    id: location.id,
    title: `${location.name}: cảm hứng du lịch bản địa`,
    description: location.shortDescription,
    href: `/destinations/${location.slug}`,
    image: location.imageUrl,
  }));

  return (
    <section className="space-y-5">
      <HomeSectionHeading
        eyebrow="Cảm hứng du lịch"
        title="Cảm hứng khám phá Việt Nam"
        description="Refactor từ trang blog tĩnh thành section storytelling có định hướng điều hướng đến destination detail."
      />
      {stories.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {stories.map((story) => (
            <article key={story.id} className="iv-card overflow-hidden">
              <Link href={story.href} className="group block">
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{story.title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{story.description}</p>
                  <p className="text-sm font-semibold text-teal-700">Xem chi tiết</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <article className="iv-card p-5 text-sm text-slate-600">
          Chưa có dữ liệu cảm hứng du lịch. Vui lòng thêm điểm đến để hiển thị mục này.
        </article>
      )}
    </section>
  );
}
