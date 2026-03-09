import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles, Telescope } from "lucide-react";
import { SectionHeading } from "@/components/common/section-heading";
import { LocationCard } from "@/components/location/location-card";
import { TourCard } from "@/components/tour/tour-card";
import { getHomePublicData } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

const whyChooseUs = [
  {
    title: "Lịch trình tối ưu",
    description: "Thiết kế tuyến điểm hợp lý, cân bằng giữa khám phá và nghỉ dưỡng.",
    icon: Telescope,
  },
  {
    title: "Dịch vụ chỉn chu",
    description: "Đội ngũ hỗ trợ nhanh, thông tin rõ ràng và minh bạch chi phí.",
    icon: ShieldCheck,
  },
  {
    title: "Trải nghiệm chất lượng",
    description: "Tour được tuyển chọn kỹ, ưu tiên tính thực tế và cảm xúc chuyến đi.",
    icon: Sparkles,
  },
];

const testimonials = [
  {
    name: "Ngọc Mai",
    role: "Khách hàng tại TP. Hồ Chí Minh",
    content: "Lịch trình rõ ràng, tư vấn nhiệt tình và dịch vụ rất chuyên nghiệp.",
  },
  {
    name: "Tuấn Anh",
    role: "Khách hàng tại Hà Nội",
    content: "Mình đặt tour rất nhanh, thông tin minh bạch, trải nghiệm thực tế đúng như mô tả.",
  },
  {
    name: "Bảo Trân",
    role: "Khách hàng tại Đà Nẵng",
    content: "Giao diện dễ dùng, tìm tour nhanh và có nhiều gợi ý địa điểm hay.",
  },
];

export default async function HomePage() {
  const data = await getHomePublicData().catch(() => ({
    featuredLocations: [],
    featuredTours: [],
  }));

  return (
    <div className="space-y-16 pb-8 pt-6 md:space-y-24 md:pt-10">
      <section className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
            Travel Booking System
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Khám phá hành trình trong mơ với trải nghiệm đặt tour hiện đại.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
            Nền tảng du lịch dành cho người Việt, giao diện dễ dùng, thông tin rõ ràng và nhiều tour
            nổi bật để bạn bắt đầu chuyến đi tiếp theo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tours"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Khám phá tour ngay
            </Link>
            <Link
              href="/dia-diem"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Xem các địa điểm
            </Link>
          </div>
          <div className="grid max-w-xl grid-cols-1 gap-2 pt-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Dữ liệu tour đa dạng, cập nhật liên tục
            </p>
            <p className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Tìm kiếm và lọc tour theo nhu cầu
            </p>
          </div>
        </div>

        <div className="relative h-[420px] overflow-hidden rounded-[2rem] border bg-card shadow-lg">
          <Image
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
            alt="Cảnh du lịch thiên nhiên"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-md backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Điểm đến nổi bật</p>
            <p className="mt-2 text-base font-semibold text-slate-800">Lựa chọn linh hoạt cho kỳ nghỉ 2026</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Địa điểm nổi bật"
          title="Khám phá các điểm đến được yêu thích"
          description="Danh sách địa điểm nổi bật phù hợp cho du lịch nghỉ dưỡng, khám phá thiên nhiên và trải nghiệm văn hóa."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.featuredLocations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Tour phổ biến"
          title="Những tour được quan tâm nhiều"
          description="Lựa chọn nhanh các tour nổi bật để bắt đầu hành trình của bạn."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm md:p-10">
        <SectionHeading
          eyebrow="Lý do chọn chúng tôi"
          title="Đặt tour dễ dàng, trải nghiệm chuyên nghiệp"
          description="Tập trung vào trải nghiệm người dùng và chất lượng dịch vụ trong từng hành trình."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {whyChooseUs.map((item) => (
            <article key={item.title} className="rounded-2xl border bg-background p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Khách hàng nói gì"
          title="Đánh giá tích cực từ người dùng"
          description="Phản hồi thực tế giúp nền tảng cải thiện chất lượng mỗi ngày."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm leading-7 text-muted-foreground">“{item.content}”</p>
              <p className="mt-4 text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white md:p-10">
        <h2 className="text-2xl font-bold md:text-3xl">Sẵn sàng cho chuyến đi tiếp theo?</h2>
        <p className="mt-3 max-w-2xl text-sm text-blue-100 md:text-base">
          Bắt đầu tìm tour phù hợp và lên kế hoạch du lịch chỉ trong vài phút.
        </p>
        <div className="mt-6">
          <Link
            href="/tours"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            Xem tất cả tour
          </Link>
        </div>
      </section>
    </div>
  );
}
