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
    <article className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-700">Yêu cầu tư vấn mới</h3>
        <Link href="/admin/inquiries" className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">
          Xem tất cả
        </Link>
      </div>

      {items.length ? (
        <div className="space-y-2.5">
          {items.slice(0, 7).map((inquiry) => (
            <article key={inquiry.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">{inquiry.fullName}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone[inquiry.status]}`}>
                  {statusLabel[inquiry.status]}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">{inquiry.referenceCode} • {formatDate(inquiry.createdAt)}</p>
              <p className="mt-1 line-clamp-1 text-sm text-slate-600">{inquiry.email} • {inquiry.phone}</p>

              {inquiry.tour ? (
                <Link href={`/tours/${inquiry.tour.slug}`} className="mt-1 block text-xs text-cyan-700 hover:text-cyan-800">
                  {inquiry.tour.title}
                </Link>
              ) : null}
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
