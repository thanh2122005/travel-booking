import Link from "next/link";
import { CheckCircle2, ReceiptText } from "lucide-react";

type BookingSuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function BookingSuccessPage({ searchParams }: BookingSuccessPageProps) {
  const params = await searchParams;
  const bookingCode = normalizeParam(params.code);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <section className="iv-card rounded-3xl border-slate-200/80 bg-gradient-to-b from-white to-teal-50/20 p-6 md:p-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">Đặt tour thành công</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Yêu cầu đặt tour của bạn đã được ghi nhận. Đội ngũ tư vấn sẽ liên hệ để xác nhận lịch trình sớm nhất.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mã đơn đặt tour</p>
          <p className="mt-2 inline-flex items-center gap-2 text-xl font-bold text-slate-900">
            <ReceiptText className="h-5 w-5 text-teal-600" />
            {bookingCode || "Đang cập nhật"}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/booking"
            className="iv-btn-primary inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold"
          >
            Xem danh sách đơn
          </Link>
          <Link
            href="/tours"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Tiếp tục khám phá tour
          </Link>
        </div>
      </section>
    </div>
  );
}
