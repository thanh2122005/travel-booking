import { Mail, MapPin, Phone } from "lucide-react";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
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
        eyebrow="Contact"
        title="Kết nối với đội ngũ tư vấn"
        description="Trang contact được nâng cấp từ template cũ: giữ style hero video và bổ sung booking inquiry form theo hướng sản phẩm thật."
        videoSrc="/immerse-vietnam/videos/blogcover.mp4"
      />

      <section className="space-y-6">
        <HomeSectionHeading
          eyebrow="Booking Inquiry"
          title="Gửi yêu cầu đặt tour"
          description="Form này là bước tiền đề để kết nối với API booking và CRM trong phase sau."
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <form className="iv-card space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="inquiry-full-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Họ và tên
                </label>
                <input
                  id="inquiry-full-name"
                  placeholder="Nguyễn Văn A"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="inquiry-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Số điện thoại
                </label>
                <input
                  id="inquiry-phone"
                  placeholder="0909123456"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="inquiry-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="inquiry-email"
                  type="email"
                  placeholder="ban@example.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="inquiry-tour" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tour quan tâm
                </label>
                <select
                  id="inquiry-tour"
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Chọn tour</option>
                  {data.featuredTours.slice(0, 8).map((tour) => (
                    <option key={tour.id} value={tour.id}>
                      {tour.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="inquiry-date" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Ngày khởi hành mong muốn
                </label>
                <input
                  id="inquiry-date"
                  type="date"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="inquiry-guests" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Số khách
                </label>
                <input
                  id="inquiry-guests"
                  type="number"
                  min={1}
                  defaultValue={2}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inquiry-message" className="mb-1.5 block text-sm font-medium text-slate-700">
                Nội dung cần hỗ trợ
              </label>
              <textarea
                id="inquiry-message"
                rows={5}
                placeholder="Bạn muốn ưu tiên lịch trình nào?"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>

            <button type="submit" className="iv-btn-primary inline-flex h-11 items-center justify-center px-6 text-sm font-semibold">
              Gửi yêu cầu tư vấn
            </button>
          </form>

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
                Yêu cầu booking gấp sẽ được ưu tiên trong vòng 30 phút.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
