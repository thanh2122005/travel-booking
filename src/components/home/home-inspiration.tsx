import Image from "next/image";
import Link from "next/link";
import { HomeSectionHeading } from "@/components/home/home-section-heading";

const inspirationStories = [
  {
    title: "Ha Noi: truyen thong va nhiep song hien dai",
    description: "Pho co, am thuc duong pho va nhung diem van hoa tao nen trai nghiem khac biet.",
    href: "/destinations/ha-noi",
    image: "/immerse-vietnam/images/HaNoi/hanoicover.jpg",
  },
  {
    title: "Da Nang: diem giao cua bien va nui",
    description: "Ket hop nghi duong bien, city tour va hanh trinh qua Hoi An trong mot booking flow.",
    href: "/destinations/da-nang",
    image: "/immerse-vietnam/images/DaNang/danangcover.jpg",
  },
  {
    title: "Ha Long: hanh trinh du thuyen giua di san",
    description: "Canh quan ky vi, lich trinh bien dao va trai nghiem nghi duong duoc dat nhieu nhat.",
    href: "/destinations/ha-long",
    image: "/immerse-vietnam/images/HaLong/halongcover.jpg",
  },
];

export function HomeInspiration() {
  return (
    <section className="space-y-5">
      <HomeSectionHeading
        eyebrow="Travel Inspiration"
        title="Cam hung kham pha Viet Nam"
        description="Refactor tu trang blog tinh thanh section storytelling co dinh huong dieu huong den destination detail."
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
                <p className="text-sm font-semibold text-teal-700">Xem chi tiet</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
