import Link from "next/link";

export function HomeCTA() {
  return (
    <section className="overflow-hidden rounded-3xl border border-teal-900/20 bg-[linear-gradient(130deg,#08324a,#0f766e,#0ea5a0)] p-7 text-white shadow-sm md:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">Sẵn sàng đặt tour</p>
      <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
        Lên kế hoạch chuyến đi Việt Nam với lộ trình rõ ràng và dễ đặt.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50 md:text-base">
        Khám phá tour, điểm đến, lịch trình, đánh giá và danh sách yêu thích trên cùng một nền tảng.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/booking"
          className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-teal-800 transition hover:bg-slate-100"
        >
          Đặt tour ngay
        </Link>
        <Link
          href="/tours"
          className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-sm font-semibold text-white transition hover:bg-white/12"
        >
          Xem bảng giá tour
        </Link>
      </div>
    </section>
  );
}
