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
        title="Ket noi voi doi ngu tu van"
        description="Trang contact duoc nang cap tu template cu: giu style hero video va bo sung booking inquiry form theo huong san pham that."
        videoSrc="/immerse-vietnam/videos/blogcover.mp4"
      />

      <section className="space-y-6">
        <HomeSectionHeading
          eyebrow="Booking Inquiry"
          title="Gui yeu cau dat tour"
          description="Form nay la buoc tien de ket noi voi API booking va CRM trong phase sau."
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <form className="iv-card space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="inquiry-full-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Ho va ten
                </label>
                <input
                  id="inquiry-full-name"
                  placeholder="Nguyen Van A"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="inquiry-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                  So dien thoai
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
                  Tour quan tam
                </label>
                <select
                  id="inquiry-tour"
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Chon tour</option>
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
                  Ngay khoi hanh mong muon
                </label>
                <input
                  id="inquiry-date"
                  type="date"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="inquiry-guests" className="mb-1.5 block text-sm font-medium text-slate-700">
                  So khach
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
                Noi dung can ho tro
              </label>
              <textarea
                id="inquiry-message"
                rows={5}
                placeholder="Ban muon uu tien lich trinh nao?"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>

            <button type="submit" className="iv-btn-primary inline-flex h-11 items-center justify-center px-6 text-sm font-semibold">
              Gui yeu cau tu van
            </button>
          </form>

          <aside className="space-y-4">
            <article className="iv-card p-6">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Thong tin lien he</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Doi ngu tu van luon san sang de ho tro dat tour theo ngan sach va lich trinh cua ban.
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
                  144 Xuan Thuy, Cau Giay, Ha Noi
                </p>
              </div>
            </article>

            <article className="iv-card p-6">
              <h3 className="text-lg font-semibold text-slate-900">Thoi gian phan hoi</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">8:00 - 22:00 moi ngay, bao gom cuoi tuan.</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Yeu cau booking gap se duoc uu tien trong vong 30 phut.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}
