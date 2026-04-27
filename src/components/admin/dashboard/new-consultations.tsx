import Link from "next/link";
import type { InquiryStatus } from "@prisma/client";
import {
  parseCapacityShortageMessage,
} from "@/lib/utils/capacity-shortage-inquiry";
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
  const pendingCount = items.filter((inquiry) => inquiry.status === "PENDING").length;

  return (
    <article className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-700">Yêu cầu tư vấn mới</h3>
          {pendingCount > 0 ? (
            <span className="inline-flex h-6 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {pendingCount} mới
            </span>
          ) : (
            <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-500">
              Không có mới
            </span>
          )}
        </div>

        <Link
          href="/admin/inquiries"
          className="text-xs font-semibold text-cyan-700 hover:text-cyan-800"
        >
          Xem tất cả
        </Link>
      </div>

      {items.length ? (
        <div className="h-[500px] space-y-2.5 overflow-y-auto pr-1">
          {items.slice(0, 7).map((inquiry) => {
            const capacityShortage = parseCapacityShortageMessage(inquiry.message);
            const tourTitle = capacityShortage?.tourTitle || inquiry.tour?.title || null;

            return (
              <article key={inquiry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">{inquiry.fullName}</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {capacityShortage ? (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                        Thiếu chỗ
                      </span>
                    ) : null}
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone[inquiry.status]}`}>
                      {statusLabel[inquiry.status]}
                    </span>
                  </div>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {inquiry.referenceCode} • {formatDate(inquiry.createdAt)}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-slate-600">
                  {inquiry.email} • {inquiry.phone}
                </p>

                {capacityShortage ? (
                  <div className="mt-1 rounded-lg border border-rose-100 bg-rose-50/60 px-2.5 py-2 text-xs text-rose-800">
                    <p>
                      Yêu cầu: <span className="font-semibold">{capacityShortage.requestedGuests ?? inquiry.numberOfGuests} khách</span>
                      {" • "}
                      Còn: <span className="font-semibold">{capacityShortage.remainingSeats ?? 0} chỗ</span>
                    </p>
                    {capacityShortage.departureDate ? (
                      <p className="mt-1">Ngày đi: {capacityShortage.departureDate}</p>
                    ) : null}
                  </div>
                ) : null}

                {tourTitle ? (
                  <p className="mt-1 text-xs text-slate-700">
                    Tour: <span className="font-semibold">{tourTitle}</span>
                  </p>
                ) : null}

                {inquiry.tour ? (
                  <Link href={`/tours/${inquiry.tour.slug}`} className="mt-1 block text-xs text-cyan-700 hover:text-cyan-800">
                    Mở tour
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Chưa có yêu cầu tư vấn mới.
        </p>
      )}
    </article>
  );
}
