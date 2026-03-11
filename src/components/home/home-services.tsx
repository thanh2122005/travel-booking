import Link from "next/link";
import { Gem, Handshake, ShieldCheck, Sparkles } from "lucide-react";
import { HomeSectionHeading } from "@/components/home/home-section-heading";

const services = [
  {
    icon: Gem,
    title: "Lưu trú cao cấp",
    description: "Gói tour ưu tiên khách sạn và resort chất lượng cao, minh bạch tiêu chuẩn dịch vụ.",
  },
  {
    icon: Handshake,
    title: "Tư vấn 1-1",
    description: "Hỗ trợ cá nhân hóa theo nhóm khách, lịch trình và ngân sách, từ ý tưởng đến đặt tour.",
  },
  {
    icon: ShieldCheck,
    title: "Thanh toán an toàn",
    description: "Xác nhận đơn nhanh, theo dõi trạng thái đặt tour và chính sách rõ ràng trong suốt hành trình.",
  },
  {
    icon: Sparkles,
    title: "Trải nghiệm thực tế",
    description: "Kết nối dữ liệu đánh giá, yêu thích và lịch trình trực tiếp từ hệ thống để trải nghiệm luôn đồng nhất.",
  },
];

export function HomeServices() {
  return (
    <section className="iv-card overflow-hidden">
      <div className="grid gap-8 bg-[linear-gradient(120deg,#08253a,#0f3f58,#0a4f66)] px-6 py-8 text-white md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10 lg:px-10 lg:py-10">
        <div>
          <HomeSectionHeading
            eyebrow="Dịch vụ"
            title="Đặt tour dễ, chuyên nghiệp và đáng tin cậy"
            description="Mục dịch vụ được thiết kế lại để làm rõ giá trị cốt lõi của nền tảng đặt tour."
          />
          <Link href="/booking" className="iv-btn-primary mt-5 inline-flex h-10 items-center px-5 text-sm font-semibold">
            Bắt đầu đặt tour
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <article key={service.title} className="rounded-2xl border border-white/20 bg-white/8 p-4">
              <service.icon className="h-6 w-6 text-teal-200" />
              <h3 className="mt-3 text-lg font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-100/90">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
