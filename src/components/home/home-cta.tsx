import Link from "next/link";

export function HomeCTA() {
  return (
    <section className="iv-card overflow-hidden bg-[linear-gradient(130deg,#0a405a,#0f7f79,#18b7a8)] p-7 text-white md:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">Sẵn sàng đặt tour</p>
      <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
        Biến template showcase thành booking website thật cho du lịch Việt Nam.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100 md:text-base">
        Bắt đầu từ homepage migrate, sau đó mở rộng tours, destination, booking flow, favorites và review với dữ liệu
        động từ Prisma.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/booking" className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-teal-800 transition hover:bg-slate-100">
          Đặt tour ngay
        </Link>
        <Link href="/tours" className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-sm font-semibold text-white transition hover:bg-white/12">
          Xem bảng giá tour
        </Link>
      </div>
    </section>
  );
}
