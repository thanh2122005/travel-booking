import Image from "next/image";
import { Clock3, Mail, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { ContactInquiryForm } from "@/components/contact/contact-inquiry-form";
import { getContactTourOptions } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

type ContactPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function normalizeLocationLabel(value: string) {
  if (!value) return "";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const supportHighlights = [
  {
    icon: Clock3,
    title: "Phản hồi nhanh",
    description: "Ưu tiên trả lời trong 30 phút cho yêu cầu khẩn.",
  },
  {
    icon: ShieldCheck,
    title: "Tư vấn rõ ràng",
    description: "Lộ trình và chi phí được trình bày minh bạch, dễ hiểu.",
  },
  {
    icon: Sparkles,
    title: "Cá nhân hóa",
    description: "Tối ưu theo sở thích, ngân sách và thời gian của bạn.",
  },
];

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const initialTourId = normalizeParam(params.tourId);
  const tourNameParam = normalizeParam(params.tourName);
  const locationParam = normalizeParam(params.location);
  const locationNameParam = normalizeParam(params.locationName);
  const locationLabel = locationNameParam || normalizeLocationLabel(locationParam);
  const initialMessage = (() => {
    if (tourNameParam && locationLabel) {
      return `Mình muốn được tư vấn tour "${tourNameParam}" tại ${locationLabel}.`;
    }
    if (tourNameParam) {
      return `Mình muốn được tư vấn chi tiết tour "${tourNameParam}".`;
    }
    if (locationLabel) {
      return `Mình muốn được tư vấn tour tại ${locationLabel}.`;
    }
    return "";
  })();

  const tours = await getContactTourOptions(initialTourId).catch(() => []);
  const validInitialTourId = tours.some((tour) => tour.id === initialTourId) ? initialTourId : "";

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <section className="overflow-hidden rounded-3xl border bg-card">
        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              <Mail className="h-3.5 w-3.5" />
              Liên hệ tư vấn
            </p>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">Kết nối với đội ngũ chuyên gia du lịch</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Chúng tôi hỗ trợ bạn chọn tour theo nhu cầu thực tế, tránh lãng phí thời gian và tối ưu trải nghiệm ngay từ bước tư vấn.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {supportHighlights.map((item) => (
                <article key={item.title} className="rounded-2xl border bg-slate-50 p-4">
                  <item.icon className="h-5 w-5 text-teal-600" />
                  <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="relative min-h-[260px] overflow-hidden rounded-2xl border">
            <Image
              src="/immerse-vietnam/images/DaNang/DaNang.jpg"
              alt="Tư vấn du lịch"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 35vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Chuyên viên tư vấn</p>
              <p className="mt-1 text-sm text-slate-700">Luôn đồng hành từ lúc chọn tour đến khi hoàn tất chuyến đi.</p>
            </div>
          </article>
        </div>
      </section>

      <section id="gui-yeu-cau" className="scroll-mt-24 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <ContactInquiryForm
          tours={tours}
          initialTourId={validInitialTourId || undefined}
          initialMessage={initialMessage || undefined}
        />

        <aside id="thong-tin-lien-he" className="scroll-mt-24 space-y-4">
          <article className="iv-card p-6">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Thông tin liên hệ</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Đội ngũ tư vấn luôn sẵn sàng hỗ trợ đặt tour theo ngân sách và lịch trình riêng của bạn.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal-600" />
                +84 866 055 283
              </p>
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal-600" />
                hello@immersevietnam.vn
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-600" />
                144 Xuân Thủy, Cầu Giấy, Hà Nội
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="tel:+84866055283"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
              >
                Gọi ngay
              </a>
              <a
                href="mailto:hello@immersevietnam.vn"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Gửi email
              </a>
            </div>
          </article>

          <article className="iv-card p-6">
            <h3 className="text-lg font-semibold text-slate-900">Câu hỏi thường gặp</h3>
            <div className="mt-3 space-y-2">
              <details className="rounded-lg border border-slate-200 px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Bao lâu nhận được phản hồi?</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">Trong giờ làm việc, chúng tôi phản hồi từ 15 đến 30 phút.</p>
              </details>
              <details className="rounded-lg border border-slate-200 px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Có tư vấn theo ngân sách không?</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">Có. Bạn chỉ cần ghi rõ ngân sách dự kiến trong form để được gợi ý phù hợp.</p>
              </details>
              <details className="rounded-lg border border-slate-200 px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Có hỗ trợ đoàn công ty không?</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">Có. Chúng tôi có gói lịch trình riêng cho đoàn team building và doanh nghiệp.</p>
              </details>
            </div>
          </article>
        </aside>
      </section>

      <MobileQuickActions
        items={[
          { href: "#gui-yeu-cau", label: "Gửi yêu cầu", icon: Mail, active: true },
          { href: "#thong-tin-lien-he", label: "Thông tin", icon: MapPin },
          { href: "tel:+84866055283", label: "Gọi ngay", icon: Phone },
        ]}
      />
    </div>
  );
}
