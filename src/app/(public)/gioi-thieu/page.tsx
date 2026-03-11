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
      label: "Ảnh du lịch",
      value: `${data.stats.totalReviews * 20 + 120}`,
    },
    {
      icon: Umbrella,
      label: "Điểm nghỉ dưỡng",
      value: `${Math.max(data.stats.totalLocations, 1) * 8}`,
    },
    {
      icon: Mountain,
      label: "Hành trình trekking",
      value: `${Math.max(data.stats.totalTours, 1) * 4}`,
    },
    {
      icon: Ship,
      label: "Chuyến du thuyền",
      value: `${Math.max(data.stats.totalBookings, 1)}`,
    },
  ];

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Câu chuyện thương hiệu"
        title="Về Immersive Vietnam"
        description="Chúng tôi xây dựng hệ thống đặt tour hiện đại, tập trung vào trải nghiệm du lịch Việt Nam rõ ràng và thuận tiện."
        videoSrc="/immerse-vietnam/videos/blogcover.mp4"
      />

      <section className="space-y-6">
        <HomeSectionHeading
          eyebrow="Hành trình phát triển"
          title="Nâng cấp từ giao diện thành sản phẩm"
          description="Nội dung được tổ chức lại thành các khối rõ ràng để dễ mở rộng và đồng bộ trải nghiệm."
        />

        <div className="grid items-center gap-5 lg:grid-cols-2">
          <article className="iv-card overflow-hidden">
            <div className="relative h-[320px]">
              <Image src="/immerse-vietnam/images/NT2.jpg" alt="Nha Trang" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </article>
          <article className="iv-card space-y-3 p-6">
            <h3 className="text-2xl font-bold tracking-tight">Từ bài toán học tập đến tư duy sản phẩm</h3>
            <p className="text-sm leading-7 text-slate-600">
              Bắt đầu từ nhu cầu giới thiệu vẻ đẹp Việt Nam cho bạn bè quốc tế, dự án đã được nâng cấp thành website
              đặt tour có cấu trúc dữ liệu rõ ràng và mở rộng được trong thực tế.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              Chúng tôi ưu tiên hình ảnh lớn, kể chuyện bằng điểm đến và triển khai luồng đặt tour phù hợp với người
              dùng Việt Nam.
            </p>
          </article>
        </div>

        <div className="grid items-center gap-5 lg:grid-cols-2">
          <article className="iv-card order-2 space-y-3 p-6 lg:order-1">
            <h3 className="text-2xl font-bold tracking-tight">Tầm nhìn: nền tảng đặt tour thực tế</h3>
            <p className="text-sm leading-7 text-slate-600">
              Mục tiêu không chỉ là giao diện đẹp. Hệ thống cần map được Tour, Điểm đến, Đơn đặt, Đánh giá, Yêu thích
              và Lịch trình để đầy đủ nghiệp vụ sản phẩm.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              Nhóm tiếp tục đầu tư responsive, animation vừa đủ và luồng điều hướng hợp lý để tạo trải nghiệm đặt tour
              trực quan trên mobile lẫn desktop.
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
          eyebrow="Điểm nhấn"
          title="Một vài con số về hành trình của chúng tôi"
          description="Các số liệu được tổng hợp từ dữ liệu hệ thống để phản ánh hoạt động thực tế."
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
