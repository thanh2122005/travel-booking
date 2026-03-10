import Image from "next/image";
import Link from "next/link";
import { HomeSectionHeading } from "@/components/home/home-section-heading";

const inspirationStories = [
  {
    title: "Hà Nội: truyền thống và nhịp sống hiện đại",
    description: "Phố cổ, ẩm thực đường phố và những điểm văn hóa tạo nên trải nghiệm khác biệt.",
    href: "/destinations/ha-noi",
    image: "/immerse-vietnam/images/HaNoi/hanoicover.jpg",
  },
  {
    title: "Đà Nẵng: điểm giao của biển và núi",
    description: "Kết hợp nghỉ dưỡng biển, city tour và hành trình qua Hội An trong một booking flow.",
    href: "/destinations/da-nang",
    image: "/immerse-vietnam/images/DaNang/danangcover.jpg",
  },
  {
    title: "Hạ Long: hành trình du thuyền giữa di sản",
    description: "Cảnh quan kỳ vĩ, lịch trình biển đảo và trải nghiệm nghỉ dưỡng được đặt nhiều nhất.",
    href: "/destinations/ha-long",
    image: "/immerse-vietnam/images/HaLong/halongcover.jpg",
  },
];

export function HomeInspiration() {
  return (
    <section className="space-y-5">
      <HomeSectionHeading
        eyebrow="Travel Inspiration"
        title="Cảm hứng khám phá Việt Nam"
        description="Refactor từ trang blog tĩnh thành section storytelling có định hướng điều hướng đến destination detail."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {inspirationStories.map((story) => (
          <article key={story.title} className="iv-card overflow-hidden">
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
    </section>
  );
}
