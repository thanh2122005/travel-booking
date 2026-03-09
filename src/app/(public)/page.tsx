import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    icon: Compass,
    title: "Nền tảng đã sẵn sàng",
    description: "Phase 1 đã thiết lập xong kiến trúc, database và authentication nền tảng.",
  },
  {
    icon: ShieldCheck,
    title: "Phân quyền đầy đủ",
    description: "Đã có guard cho guest, user và admin bằng middleware + session.",
  },
  {
    icon: Sparkles,
    title: "UI tiếng Việt",
    description: "Toàn bộ nội dung hiển thị mặc định ở giao diện đang dùng tiếng Việt.",
  },
];

export default function HomePage() {
  return (
    <section className="space-y-10 py-8 md:py-16">
      <div className="rounded-3xl border bg-card/70 p-8 shadow-sm backdrop-blur md:p-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Travel Booking System
        </p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-foreground md:text-5xl">
          Hệ thống đặt tour du lịch full-stack đang được triển khai theo từng phase.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Đây là nền tảng kỹ thuật của dự án. Các trang nghiệp vụ chi tiết sẽ được hoàn thiện ở
          Phase 2 trở đi.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dang-ky"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tạo tài khoản
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/dang-nhap"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Đăng nhập
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title} className="rounded-2xl border bg-card/90 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
