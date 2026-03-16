import Image from "next/image";
import Link from "next/link";
import { Compass, Gem, Globe2, HeartHandshake, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { getHomePublicData } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

const strengths = [
  {
    icon: ShieldCheck,
    title: "Dữ liệu đáng tin cậy",
    description: "Thông tin tour, trạng thái booking và đánh giá được quản lý rõ ràng, minh bạch.",
  },
  {
    icon: Compass,
    title: "Hành trình thực tế",
    description: "Mỗi tour đều có lịch trình cụ thể để khách hàng hình dung trước trải nghiệm.",
  },
  {
    icon: HeartHandshake,
    title: "Tư vấn đồng hành",
    description: "Đội ngũ hỗ trợ chọn tour theo sở thích, ngân sách và thời gian cá nhân.",
  },
  {
    icon: Gem,
    title: "Trình bày chỉn chu",
    description: "Tập trung vào trải nghiệm xem tour đẹp, rõ và thuyết phục ngay từ lần đầu truy cập.",
  },
];

const process = [
  {
    step: "01",
    title: "Khơi nguồn cảm hứng",
    description: "Khách hàng khám phá điểm đến qua hình ảnh và câu chuyện trực quan.",
  },
  {
    step: "02",
    title: "Chọn hành trình",
    description: "Lọc tour theo ngân sách, địa điểm, thời lượng và nhu cầu thực tế.",
  },
  {
    step: "03",
    title: "Tư vấn & xác nhận",
    description: "Đội ngũ tư vấn hoàn thiện phương án phù hợp nhất cho từng nhóm khách.",
  },
  {
    step: "04",
    title: "Trải nghiệm trọn vẹn",
    description: "Khởi hành với lịch trình rõ ràng và đồng bộ trong suốt chuyến đi.",
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
    <div className="space-y-12 pb-24 lg:pb-0">
      <section className="relative overflow-hidden rounded-3xl border">
        <div className="absolute inset-0">
          <Image
            src="/immerse-vietnam/images/header-bg.jpg"
            alt="Khung cảnh du lịch Việt Nam"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/40" />
        </div>

        <div className="relative grid gap-8 p-6 text-white md:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <article className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              <Globe2 className="h-3.5 w-3.5" />
              Về chúng tôi
            </p>
            <h1 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">
              Biến việc chọn tour từ “mất thời gian” thành trải nghiệm rõ ràng và đầy cảm hứng.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-100 md:text-base">
              Immersive Vietnam không chỉ là nơi hiển thị danh sách tour. Chúng tôi xây dựng một hệ sinh thái đặt tour
              đủ nghiệp vụ, dễ hiểu và thẩm mỹ để khách hàng tự tin ra quyết định nhanh hơn.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/tours"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Khám phá tour
              </Link>
              <Link
                href="/lien-he"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/40 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Liên hệ tư vấn
              </Link>
            </div>
          </article>

          <article className="grid gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">Tổng quan nền tảng</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/25 bg-black/20 p-3">
                <p className="text-xs text-slate-200">Tour mở bán</p>
                <p className="mt-1 text-2xl font-black">{data.stats.totalTours}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-black/20 p-3">
                <p className="text-xs text-slate-200">Điểm đến</p>
                <p className="mt-1 text-2xl font-black">{data.stats.totalLocations}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-black/20 p-3">
                <p className="text-xs text-slate-200">Lượt booking</p>
                <p className="mt-1 text-2xl font-black">{data.stats.totalBookings}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-black/20 p-3">
                <p className="text-xs text-slate-200">Đánh giá thật</p>
                <p className="mt-1 text-2xl font-black">{data.stats.totalReviews}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="relative h-[420px]">
            <Image
              src="/immerse-vietnam/images/DaNang/danangcoverGOC.jpg"
              alt="Trải nghiệm du lịch"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
        </article>
        <article className="space-y-4 rounded-3xl border bg-card p-6 md:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            <MapPinned className="h-3.5 w-3.5" />
            Triết lý sản phẩm
          </p>
          <h2 className="text-3xl font-black leading-tight tracking-tight">
            Không chạy theo nhiều thứ thừa, chỉ tập trung thứ khách hàng cần để chốt tour.
          </h2>
          <p className="text-sm leading-7 text-slate-600 md:text-base">
            Chúng tôi tin rằng một website du lịch tốt cần trả lời nhanh ba câu hỏi: đi đâu, đi như thế nào,
            và vì sao tour này phù hợp với tôi. Vì vậy mọi nội dung được thiết kế để ra quyết định nhanh,
            không gây rối mắt hoặc ép người dùng đọc thông tin không cần thiết.
          </p>
          <p className="text-sm leading-7 text-slate-600 md:text-base">
            Song song với thiết kế, nền tảng còn có hệ thống dữ liệu và phân quyền đầy đủ để vận hành như một sản phẩm thật,
            từ người dùng đến quản trị viên.
          </p>
        </article>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-black tracking-tight">Điểm khác biệt của chúng tôi</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {strengths.map((item) => (
            <article key={item.title} className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <item.icon className="h-6 w-6 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border bg-card p-6 md:p-8">
        <h2 className="text-2xl font-black tracking-tight">Hành trình phục vụ khách hàng</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {process.map((item) => (
            <article key={item.step} className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Bước {item.step}</p>
              <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-black tracking-tight">Khoảnh khắc thực tế từ hành trình</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            "/immerse-vietnam/images/NhaTrang/NT1.jpg",
            "/immerse-vietnam/images/HoiAn/HA1.jpg",
            "/immerse-vietnam/images/HaNoi/HN1.jpg",
            "/immerse-vietnam/images/PhuQuoc/PQ1.jpg",
          ].map((src, index) => (
            <article key={src} className="group overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="relative h-64">
                <Image src={src} alt={`Khoảnh khắc du lịch ${index + 1}`} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 25vw" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-[linear-gradient(140deg,#0f172a,#0e7490)] p-7 text-white md:p-10">
        <h2 className="text-2xl font-black md:text-3xl">Sẵn sàng biến kế hoạch du lịch thành trải nghiệm thật?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100 md:text-base">
          Bắt đầu từ danh sách tour phù hợp hoặc gửi yêu cầu để đội ngũ tư vấn đồng hành cùng bạn.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/tours"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Xem tour ngay
          </Link>
          <Link
            href="/lien-he"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/40 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Nhận tư vấn cá nhân hóa
          </Link>
        </div>
      </section>

      <MobileQuickActions
        items={[
          { href: "/tours", label: "Tour", icon: Compass, active: true },
          { href: "/gallery", label: "Thư viện", icon: Sparkles },
          { href: "/lien-he", label: "Liên hệ", icon: Globe2 },
        ]}
      />
    </div>
  );
}
