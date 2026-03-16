import Link from "next/link";
import type { InquiryStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils/format";
import type { DashboardRecentInquiry } from "@/components/admin/dashboard/types";

type NewConsultationsProps = {
  items: DashboardRecentInquiry[];
};

const statusLabel: Record<InquiryStatus, string> = {
  PENDING: "Chờ xử lý",
  RESOLVED: "Đã xử lý",
};

const statusTone: Record<InquiryStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function NewConsultations({ items }: NewConsultationsProps) {
  return (
    <article className="iv-card rounded-2xl border-slate-200 p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-800">Yêu cầu tư vấn mới</h3>
        <Link href="/admin/inquiries" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          Xem tất cả
        </Link>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((inquiry) => (
            <article key={inquiry.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{inquiry.referenceCode}</p>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[inquiry.status]}`}>
                  {statusLabel[inquiry.status]}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-600">{inquiry.fullName} · {inquiry.phone}</p>
              <p className="text-xs text-slate-500">{inquiry.email}</p>

              {inquiry.tour ? (
                <p className="mt-2 text-xs text-slate-500">
                  Tour:{" "}
                  <Link href={`/tours/${inquiry.tour.slug}`} className="font-medium text-cyan-700 hover:text-cyan-800">
                    {inquiry.tour.title}
                  </Link>
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{inquiry.numberOfGuests} khách</span>
                {inquiry.departureDate ? <span>Khởi hành: {formatDate(inquiry.departureDate)}</span> : null}
                <span>Tạo lúc: {formatDate(inquiry.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Chưa có yêu cầu tư vấn mới.
        </p>
      )}
    </article>
  );
}
