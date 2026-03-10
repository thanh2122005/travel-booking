import Link from "next/link";
import { Gem, Handshake, ShieldCheck, Sparkles } from "lucide-react";
import { HomeSectionHeading } from "@/components/home/home-section-heading";

const services = [
  {
    icon: Gem,
    title: "Lu tru premium",
    description: "Goi tour uu tien khach san va resort chat luong cao, minh bach tieu chuan dich vu.",
  },
  {
    icon: Handshake,
    title: "Tu van 1-1",
    description: "Ho tro ca nhan hoa theo nhom khach, lich trinh va ngan sach, tu y tuong den dat tour.",
  },
  {
    icon: ShieldCheck,
    title: "Thanh toan an toan",
    description: "Xac nhan don nhanh, theo doi trang thai booking va chinh sach ro rang trong suot hanh trinh.",
  },
  {
    icon: Sparkles,
    title: "Trai nghiem thuc te",
    description: "Map du lieu review/favorite/itinerary tu he thong thay vi landing tinh, de mo rong thanh san pham.",
  },
];

export function HomeServices() {
  return (
    <section className="iv-card overflow-hidden">
      <div className="grid gap-8 bg-[linear-gradient(120deg,#08253a,#0f3f58,#0a4f66)] px-6 py-8 text-white md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10 lg:px-10 lg:py-10">
        <div>
          <HomeSectionHeading
            eyebrow="Our Services"
            title="Dat tour de, chuyen nghiep va dang tin cay"
            description="Refactor tu section services cua template cu, nang cap thanh proposition ro rang cho website booking."
          />
          <Link href="/booking" className="iv-btn-primary mt-5 inline-flex h-10 items-center px-5 text-sm font-semibold">
            Bat dau dat tour
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
