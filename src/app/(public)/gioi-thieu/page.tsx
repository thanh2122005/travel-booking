import Image from "next/image";
import Link from "next/link";
import { Compass, Globe2, ShieldCheck, Sparkles, Telescope, Users } from "lucide-react";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { getHomePublicData } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

const valueItems = [
  {
    icon: ShieldCheck,
    title: "Tin cậy",
    description: "Thông tin rõ ràng, trạng thái minh bạch và dữ liệu nhất quán.",
  },
  {
    icon: Compass,
    title: "Thực tế",
    description: "Tập trung luồng nghiệp vụ thật thay vì chỉ mô phỏng giao diện.",
  },
  {
    icon: Sparkles,
    title: "Trải nghiệm",
    description: "Ưu tiên cảm giác dễ dùng và rõ ràng trên cả desktop lẫn mobile.",
  },
];

const timeline = [
  {
    title: "Khởi tạo nền tảng",
    description: "Xây dựng kiến trúc Next.js + Prisma + Auth với dữ liệu seed đủ để demo.",
  },
  {
    title: "Hoàn thiện public experience",
    description: "Tối ưu trang chủ, tour, địa điểm, thư viện và luồng khám phá nội dung.",
  },
  {
    title: "Mở rộng nghiệp vụ",
    description: "Tích hợp đặt tour, đánh giá, yêu thích và dashboard quản trị đầy đủ.",
  },
];

export default async function AboutPage() {
  const data = await getHomePublicData().catch(() => ({
    stats: {
      totalTours: 0,
      totalLocations: 0,
      totalBookings: 0,
      totalReviews: 0,
    },
  }));

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <section className="grid gap-6 overflow-hidden rounded-3xl border bg-card p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8">
        <article className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            <Globe2 className="h-3.5 w-3.5" />
            Giới thiệu
          </p>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            Chúng tôi xây dựng hệ thống đặt tour theo chuẩn sản phẩm thực tế.
          </h1>
          <p className="text-sm leading-7 text-slate-600 md:text-base">
            Travel Booking System tập trung giải quyết đầy đủ bài toán từ khám phá điểm đến, chọn tour,
            đặt chỗ, phản hồi người dùng đến vận hành quản trị trong một codebase nhất quán.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tour hoạt động</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{data.stats.totalTours}</p>
            </article>
            <article className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Điểm đến</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{data.stats.totalLocations}</p>
            </article>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tours"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Xem tour đang mở bán
            </Link>
            <Link
              href="/lien-he"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Liên hệ tư vấn
            </Link>
          </div>
        </article>

        <article className="relative min-h-[280px] overflow-hidden rounded-2xl border">
          <Image
            src="/immerse-vietnam/images/Sapa.jpg"
            alt="Đội ngũ du lịch"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 35vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Định hướng</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Sản phẩm gọn, đẹp và đủ nghiệp vụ để vận hành.</p>
          </div>
        </article>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Telescope className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-black tracking-tight">Hành trình phát triển</h2>
        </div>
        <div className="space-y-4 rounded-3xl border bg-card p-6">
          {timeline.map((item, index) => (
            <article key={item.title} className="relative pl-8">
              <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-teal-500" />
              {index < timeline.length - 1 ? (
                <span className="absolute left-[5px] top-6 h-[calc(100%-12px)] w-px bg-slate-200" />
              ) : null}
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-black tracking-tight">Giá trị cốt lõi</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {valueItems.map((item) => (
            <article key={item.title} className="rounded-2xl border bg-card p-5 shadow-sm">
              <item.icon className="h-6 w-6 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <MobileQuickActions
        items={[
          { href: "/tours", label: "Xem tour", icon: Compass, active: true },
          { href: "/gallery", label: "Thư viện", icon: Sparkles },
          { href: "/lien-he", label: "Liên hệ", icon: Users },
        ]}
      />
    </div>
  );
}
