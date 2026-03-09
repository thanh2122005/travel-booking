import type { Metadata } from "next";
import { SectionHeading } from "@/components/common/section-heading";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "Thông tin về nền tảng Travel Booking System.",
};

export default function AboutPage() {
  return (
    <div className="space-y-8 py-6">
      <SectionHeading
        eyebrow="Giới thiệu"
        title="Về Travel Booking System"
        description="Nền tảng web du lịch full-stack theo định hướng sản phẩm thực tế."
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          "Tập trung trải nghiệm người dùng, giao diện hiện đại và dễ sử dụng.",
          "Hỗ trợ tìm kiếm tour, địa điểm, và mở rộng đầy đủ nghiệp vụ đặt tour.",
          "Phù hợp cho demo đồ án, portfolio và phát triển thực tế về sau.",
        ].map((item) => (
          <article key={item} className="rounded-2xl border bg-card p-5">
            <p className="text-sm leading-7 text-muted-foreground">{item}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border bg-card p-6">
        <h2 className="text-xl font-bold">Mục tiêu dự án</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Xây dựng hệ thống đặt tour có kiến trúc rõ ràng, dữ liệu nhất quán và giao diện tiếng Việt
          thân thiện để phục vụ nhu cầu học tập, trình diễn và phát triển lâu dài.
        </p>
      </section>
    </div>
  );
}
