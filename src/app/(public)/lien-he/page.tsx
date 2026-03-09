import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Thông tin liên hệ và tư vấn tour du lịch.",
};

export default function ContactPage() {
  return (
    <div className="space-y-8 py-6">
      <SectionHeading
        eyebrow="Liên hệ"
        title="Kết nối với đội ngũ tư vấn"
        description="Để lại thông tin, chúng tôi sẽ liên hệ và hỗ trợ chọn tour phù hợp."
      />

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <form className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
                Họ và tên
              </label>
              <input
                id="fullName"
                placeholder="Nhập họ và tên"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
                Số điện thoại
              </label>
              <input
                id="phone"
                placeholder="Nhập số điện thoại"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              placeholder="ban@example.com"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
              Nội dung
            </label>
            <textarea
              id="message"
              rows={5}
              placeholder="Bạn cần tư vấn tour nào?"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Gửi yêu cầu tư vấn
          </button>
        </form>

        <aside className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Thông tin liên hệ</h3>
          <p className="text-sm text-muted-foreground">
            Đội ngũ hỗ trợ luôn sẵn sàng tư vấn tour phù hợp theo nhu cầu và ngân sách của bạn.
          </p>

          <p className="inline-flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-primary" />
            0909 000 123
          </p>
          <p className="inline-flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            support@travelbooking.vn
          </p>
          <p className="inline-flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            Quận 1, TP. Hồ Chí Minh
          </p>
        </aside>
      </section>
    </div>
  );
}
