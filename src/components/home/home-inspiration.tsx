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
    title: `${location.name}: cáº£m há»©ng du lá»‹ch báº£n Ä‘á»‹a`,
    description: location.shortDescription,
    href: `/dia-diem/${location.slug}`,
    image: location.imageUrl,
  }));

  return (
    <section className="space-y-5">
      <HomeSectionHeading
        eyebrow="Cáº£m há»©ng du lá»‹ch"
        title="Cáº£m há»©ng khÃ¡m phÃ¡ Viá»‡t Nam"
        description="Refactor tá»« trang blog tÄ©nh thÃ nh section storytelling cÃ³ Ä‘á»‹nh hÆ°á»›ng Ä‘iá»u hÆ°á»›ng Ä‘áº¿n destination detail."
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
                  <p className="text-sm font-semibold text-teal-700">Xem chi tiáº¿t</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <article className="iv-card p-5 text-sm text-slate-600">
          ChÆ°a cÃ³ dá»¯ liá»‡u cáº£m há»©ng du lá»‹ch. Vui lÃ²ng thÃªm Ä‘iá»ƒm Ä‘áº¿n Ä‘á»ƒ hiá»ƒn thá»‹ má»¥c nÃ y.
        </article>
      )}
    </section>
  );
}

