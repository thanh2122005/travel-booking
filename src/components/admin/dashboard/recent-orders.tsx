import Link from "next/link";
import type { BookingStatus, PaymentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { getBookingPaymentPresentation, hasPaymentRequest } from "@/lib/utils/booking-payment";
import type { DashboardRecentBooking } from "@/components/admin/dashboard/types";

type RecentOrdersProps = {
  items: DashboardRecentBooking[];
  bookingStatusLabels: Record<BookingStatus, string>;
  paymentStatusLabels: Record<PaymentStatus, string>;
};

const paymentBadgeTone: Record<PaymentStatus, string> = {
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  UNPAID: "border-amber-200 bg-amber-50 text-amber-700",
};

const bookingBadgeTone: Record<BookingStatus, string> = {
  PENDING: "border-slate-300 bg-slate-100 text-slate-500",
  CONFIRMED: "border-cyan-200 bg-cyan-50 text-cyan-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function RecentOrders({ items, bookingStatusLabels, paymentStatusLabels }: RecentOrdersProps) {
  return (
    <article className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-700">Đơn đặt gần đây</h3>
        <Link href="/admin/bookings" className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">
          Xem tất cả
        </Link>
      </div>

      {items.length ? (
        <div className="space-y-2.5">
          {items.slice(0, 7).map((booking) => (
            <article key={booking.id} className="rounded-xl border border-slate-200 bg-white p-3">
              {(() => {
                const paymentPresentation = getBookingPaymentPresentation(booking);
                const paymentLabel =
                  booking.paymentRequestedAt || booking.ticketCode
                    ? paymentPresentation.label
                    : paymentStatusLabels[booking.paymentStatus];
                return (
                  <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">{booking.bookingCode}</p>
                <p className="text-sm font-semibold text-slate-700">{formatPrice(booking.totalPrice)}</p>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {booking.fullName} • {formatDate(booking.createdAt)}
              </p>
              <Link href={`/tours/${booking.tour.slug}`} className="mt-1 block truncate text-sm text-cyan-700 hover:text-cyan-800">
                {booking.tour.title}
              </Link>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={bookingBadgeTone[booking.status]}>{bookingStatusLabels[booking.status]}</Badge>
                <Badge className={paymentBadgeTone[booking.paymentStatus]}>{paymentLabel}</Badge>
              </div>
              {hasPaymentRequest(booking) ? (
                <p className="mt-2 text-xs text-emerald-700">
                  {booking.ticketCode ? `Vé đã phát hành: ${booking.ticketCode}` : "Khách đã gửi yêu cầu thanh toán"}
                </p>
              ) : null}
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Chưa có đơn đặt mới.
        </p>
      )}
    </article>
  );
}



