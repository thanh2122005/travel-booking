import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { BookingCancelButton } from "@/components/booking/booking-cancel-button";
import { BookingPaymentRequestButton } from "@/components/booking/booking-payment-request-button";
import { BookingTicketCard } from "@/components/booking/booking-ticket-card";
import { getAuthSession } from "@/lib/auth/session";
import { getUserBookingDetail } from "@/lib/db/user-queries";
import { canCancelBooking, evaluateCancelBooking } from "@/lib/utils/booking-actions";
import { formatDate, formatPrice } from "@/lib/utils/format";
import {
  canRequestBookingPayment,
  getBookingPaymentPresentation,
} from "@/lib/utils/booking-payment";

type BookingDetailPageProps = {
  params: Promise<{ id: string }>;
};

const bookingStatusLabels: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn thành",
};

export const dynamic = "force-dynamic";

function getCancelBlockedLabel(status: string, paymentStatus: string, departureDate?: string | Date | null) {
  const decision = evaluateCancelBooking(status, paymentStatus, departureDate);
  if (decision.allowed) return null;
  if (decision.reason === "TOO_CLOSE_TO_DEPARTURE") return "Đơn đã quá hạn hủy trực tuyến (dưới 2 ngày trước ngày đi).";
  return "Đơn hiện tại không thể hủy trực tuyến.";
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return (
      <EmptyState
        title="Bạn cần đăng nhập"
        description="Đăng nhập để xem chi tiết đơn đặt tour của bạn."
        ctaHref="/dang-nhap?callbackUrl=/booking"
        ctaLabel="Đăng nhập"
      />
    );
  }

  const { id } = await params;
  let booking: Awaited<ReturnType<typeof getUserBookingDetail>> | null = null;
  let bookingLoadFailed = false;

  try {
    booking = await getUserBookingDetail(session.user.id, id, session.user.email);
  } catch {
    bookingLoadFailed = true;
  }

  if (bookingLoadFailed) {
    return (
      <EmptyState
        title="Không thể tải chi tiết đơn đặt tour"
        description="Vui lòng thử lại sau hoặc quay lại danh sách đơn của bạn."
        ctaHref="/booking"
        ctaLabel="Quay lại danh sách đơn"
      />
    );
  }

  if (!booking) {
    return (
      <EmptyState
        title="Không tìm thấy đơn đặt tour"
        description="Đơn đặt có thể đã bị xóa hoặc không thuộc tài khoản hiện tại."
        ctaHref="/booking"
        ctaLabel="Quay lại danh sách đơn"
      />
    );
  }

  const paymentPresentation = getBookingPaymentPresentation(booking);
  const canRequestPayment = canRequestBookingPayment(booking);

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="iv-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Chi tiết đơn đặt</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{booking.bookingCode}</h1>
            <p className="mt-1 text-sm text-slate-600">Ngày tạo: {formatDate(booking.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{bookingStatusLabels[booking.status] ?? booking.status}</Badge>
            <Badge variant={paymentPresentation.variant}>{paymentPresentation.label}</Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-800">Thông tin tour</p>
            <p className="mt-2 text-base font-medium text-slate-900">{booking.tour.title}</p>
            <p className="text-sm text-slate-600">Khởi hành từ: {booking.tour.departureLocation}</p>
            <p className="mt-2 text-base font-semibold text-teal-700">Tổng tiền: {formatPrice(booking.totalPrice)}</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-800">Thông tin liên hệ</p>
            <dl className="mt-2 space-y-1 text-sm text-slate-700">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Họ tên</dt><dd>{booking.fullName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Email</dt><dd>{booking.email}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Điện thoại</dt><dd>{booking.phone}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Số khách</dt><dd>{booking.numberOfGuests}</dd></div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Nhu cầu đón</dt>
                <dd>{booking.pickupMethod === "NEED_PICKUP" ? "Cần hỗ trợ đón" : "Tự đến điểm hẹn"}</dd>
              </div>
              {booking.pickupMethod === "NEED_PICKUP" ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Điểm đón mong muốn</dt>
                  <dd>{booking.pickupLocation || "-"}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Thanh toán</dt><dd>{booking.paymentMethod || "Tiêu chuẩn"}</dd></div>
              {booking.departureDate ? (
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Ngày khởi hành</dt><dd>{formatDate(booking.departureDate)}</dd></div>
              ) : null}
              {booking.paymentRequestedAt ? (
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Yêu cầu thanh toán</dt><dd>{formatDate(new Date(booking.paymentRequestedAt))}</dd></div>
              ) : null}
            </dl>
            {booking.note ? <p className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">Ghi chú: {booking.note}</p> : null}
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Thanh toán và phát hành vé</p>
          <p className="mt-2">{paymentPresentation.description}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/tours/${booking.tour.slug}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Xem tour
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại đơn của tôi
          </Link>
          {canCancelBooking(booking.status, booking.paymentStatus, booking.departureDate) ? (
            <BookingCancelButton
              bookingId={booking.id}
              bookingCode={booking.bookingCode}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            />
          ) : (
            <p className="text-sm text-slate-500">
              {getCancelBlockedLabel(booking.status, booking.paymentStatus, booking.departureDate)}
            </p>
          )}
        </div>

        {canRequestPayment ? (
          <div className="mt-4">
            <BookingPaymentRequestButton
              bookingId={booking.id}
              bookingCode={booking.bookingCode}
            />
          </div>
        ) : null}
      </section>

      {booking.paymentStatus === "PAID" && booking.ticketCode ? (
        <BookingTicketCard
          bookingCode={booking.bookingCode}
          ticketCode={booking.ticketCode}
          checkInCode={booking.checkInCode}
          ticketIssuedAt={booking.ticketIssuedAt}
          departureDate={booking.departureDate}
          fullName={booking.fullName}
          tourTitle={booking.tour.title}
          verifiedByName={booking.paymentVerifiedByName}
        />
      ) : null}
    </div>
  );
}
