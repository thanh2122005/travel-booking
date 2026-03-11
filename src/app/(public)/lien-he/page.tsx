import { Mail, MapPin, Phone } from "lucide-react";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { ContactInquiryForm } from "@/components/contact/contact-inquiry-form";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getHomePublicData } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const data = await getHomePublicData().catch(() => ({
    featuredTours: [],
  }));

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Liên hệ"
        title="Kết nối với đội ngũ tư vấn"
        description="Kết nối nhanh với đội ngũ tư vấn để nhận gợi ý lịch trình phù hợp theo nhu cầu của bạn."
        videoSrc="/immerse-vietnam/videos/blogcover.mp4"
      />

      <section className="space-y-6">
        <HomeSectionHeading
          eyebrow="Yêu cầu tư vấn"
          title="Gửi yêu cầu đặt tour"
          description="Điền thông tin cơ bản để đội ngũ tư vấn chuẩn bị phương án phù hợp cho chuyến đi của bạn."
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <ContactInquiryForm
            tours={data.featuredTours.slice(0, 8).map((tour) => ({
              id: tour.id,
              title: tour.title,
            }))}
          />

          <aside className="space-y-4">
            <article className="iv-card p-6">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Thông tin liên hệ</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Đội ngũ tư vấn luôn sẵn sàng để hỗ trợ đặt tour theo ngân sách và lịch trình của bạn.
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
            </article>

            <article className="iv-card p-6">
              <h3 className="text-lg font-semibold text-slate-900">Thời gian phản hồi</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">8:00 - 22:00 mỗi ngày, bao gồm cuối tuần.</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Yêu cầu đặt tour gấp sẽ được ưu tiên phản hồi trong vòng 30 phút.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
