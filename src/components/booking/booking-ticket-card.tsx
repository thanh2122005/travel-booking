"use client";

import { useRef } from "react";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import { CalendarDays, Printer, QrCode, Ticket } from "lucide-react";
import { buildBookingQrSvgDataUri } from "@/lib/utils/booking-payment";
import { formatDate } from "@/lib/utils/format";

type BookingTicketCardProps = {
  bookingCode: string;
  ticketCode: string;
  checkInCode?: string | null;
  ticketIssuedAt?: Date | string | null;
  paymentRequestedAt?: Date | string | null;
  departureDate?: Date | string | null;
  fullName: string;
  tourTitle: string;
  verifiedByName?: string | null;
  checkedInAt?: Date | string | null;
  checkedInByName?: string | null;
};

export function BookingTicketCard({
  bookingCode,
  ticketCode,
  checkInCode,
  ticketIssuedAt,
  paymentRequestedAt,
  departureDate,
  fullName,
  tourTitle,
  verifiedByName,
  checkedInAt,
  checkedInByName,
}: BookingTicketCardProps) {
  const checkInValue = checkInCode ?? ticketCode;
  const qrSrc = buildBookingQrSvgDataUri(checkInValue);

  const ticketRef = useRef<HTMLElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ve_Dien_Tu_${ticketCode}`,
  });

  return (
    <div className="space-y-4">
      <section ref={ticketRef} className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-sm print:m-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Vé điện tử</p>
            <h2 className="mt-1 inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Ticket className="h-5 w-5 text-emerald-700" />
              Vé đã phát hành
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handlePrint()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 print:hidden"
            >
              <Printer className="h-4 w-4" />
              Tải xuống Vé PDF
            </button>
            <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mã vé</p>
              <p className="mt-1 text-lg font-bold text-emerald-700">{ticketCode}</p>
              <p className="mt-2 text-xs text-slate-500">Mã đơn: {bookingCode}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_170px]">
          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Khách hàng</p>
              <p className="mt-1 font-semibold text-slate-900">{fullName}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-slate-500">Tour</p>
              <p className="mt-1 font-medium text-slate-800">{tourTitle}</p>
              {paymentRequestedAt ? (
                <p className="mt-3 text-sm text-slate-600">
                  Khách đã gửi yêu cầu thanh toán lúc {formatDate(new Date(paymentRequestedAt))}.
                </p>
              ) : null}
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Check-in</p>
              <p className="mt-1 font-semibold text-slate-900">{checkInValue}</p>
              {departureDate ? (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-emerald-700" />
                  Ngày đi: {formatDate(new Date(departureDate))}
                </p>
              ) : null}
              {ticketIssuedAt ? (
                <p className="mt-2 text-sm text-slate-600">Phát hành: {formatDate(new Date(ticketIssuedAt))}</p>
              ) : null}
              {verifiedByName ? (
                <p className="mt-2 text-sm text-slate-600">Xác nhận bởi: {verifiedByName}</p>
              ) : null}
              {checkedInAt ? (
                <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
                  Đã check-in: {formatDate(new Date(checkedInAt))}
                  {checkedInByName ? ` • ${checkedInByName}` : ""}
                </div>
              ) : null}
            </article>
          </div>

          <article className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <QrCode className="h-4 w-4 text-emerald-700" />
              QR nội bộ
            </p>
            <Image
              src={qrSrc}
              alt={`QR vé ${ticketCode}`}
              className="mt-3 h-36 w-36 rounded-xl border border-slate-200 bg-white p-2"
              width={144}
              height={144}
              unoptimized
            />
          </article>
        </div>
      </section>
    </div>
  );
}
