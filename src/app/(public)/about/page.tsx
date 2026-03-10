import Image from "next/image";
import { Camera, Mountain, Ship, Umbrella } from "lucide-react";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getHomePublicData } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const data = await getHomePublicData().catch(() => ({
    stats: {
      totalTours: 0,
      totalLocations: 0,
      totalBookings: 0,
      totalReviews: 0,
    },
  }));

  const factItems = [
    {
      icon: Camera,
      label: "Anh du lich",
      value: `${data.stats.totalReviews * 20 + 120}`,
    },
    {
      icon: Umbrella,
      label: "Diem nghi duong",
      value: `${Math.max(data.stats.totalLocations, 1) * 8}`,
    },
    {
      icon: Mountain,
      label: "Hanh trinh trekking",
      value: `${Math.max(data.stats.totalTours, 1) * 4}`,
    },
    {
      icon: Ship,
      label: "Chuyen du thuyen",
      value: `${Math.max(data.stats.totalBookings, 1)}`,
    },
  ];

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Our Story"
        title="Ve Immersive Vietnam"
        description="Tu tinh than cua template showcase, chung toi xay dung thanh he thong booking tour co du lieu dong, tap trung vao trai nghiem du lich Viet Nam."
        videoSrc="/immerse-vietnam/videos/blogcover.mp4"
      />

      <section className="space-y-6">
        <HomeSectionHeading
          eyebrow="Our Story"
          title="Years of growing together"
          description="Noi dung duoc migrate tu template about va refactor thanh block noi dung de tai su dung."
        />

        <div className="grid items-center gap-5 lg:grid-cols-2">
          <article className="iv-card overflow-hidden">
            <div className="relative h-[320px]">
              <Image src="/immerse-vietnam/images/NT2.jpg" alt="Nha Trang" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </article>
          <article className="iv-card space-y-3 p-6">
            <h3 className="text-2xl font-bold tracking-tight">From student project to product mindset</h3>
            <p className="text-sm leading-7 text-slate-600">
              Bat dau tu nhu cau gioi thieu ve dep Viet Nam cho ban be quoc te, du an da duoc nang cap thanh website
              booking co cau truc du lieu ro rang va mo rong duoc trong thuc te.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              Chung toi uu tien hinh anh lon, ke chuyen bang diem den va trien khai luong dat tour phu hop voi nguoi
              dung Viet Nam.
            </p>
          </article>
        </div>

        <div className="grid items-center gap-5 lg:grid-cols-2">
          <article className="iv-card order-2 space-y-3 p-6 lg:order-1">
            <h3 className="text-2xl font-bold tracking-tight">Vision: practical travel booking platform</h3>
            <p className="text-sm leading-7 text-slate-600">
              Muc tieu khong chi la giao dien dep. He thong can map duoc Tour, Location, Booking, Review, Favorite va
              Itinerary de day du nghiep vu san pham.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              Nhom tiep tuc dau tu responsive, animation vua du va luong dieu huong hop ly de tao trai nghiem dat tour
              truc quan tren mobile lan desktop.
            </p>
          </article>
          <article className="iv-card order-1 overflow-hidden lg:order-2">
            <div className="relative h-[320px]">
              <Image src="/immerse-vietnam/images/DN.jpg" alt="Da Nang" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </article>
        </div>
      </section>

      <section className="iv-card overflow-hidden bg-[linear-gradient(130deg,#072236,#0a324f)] p-7 text-white md:p-9">
        <HomeSectionHeading
          eyebrow="Fun Facts"
          title="Some facts about our journey"
          description="Lay cam hung tu section facts cua template cu, nhung map theo du lieu he thong hien tai."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {factItems.map((item) => (
            <article key={item.label} className="rounded-2xl border border-white/20 bg-white/8 p-4">
              <item.icon className="h-7 w-7 text-teal-200" />
              <p className="mt-3 text-3xl font-black">{item.value}</p>
              <p className="text-sm text-slate-200">{item.label}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
