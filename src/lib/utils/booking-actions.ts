export type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentStatusValue = "UNPAID" | "PAID";

const DEFAULT_MIN_DAYS_BEFORE_DEPARTURE = 2;

type CancelBookingOptions = {
  now?: Date;
  minDaysBeforeDeparture?: number;
};

export type CancelBookingDecision =
  | { allowed: true }
  | { allowed: false; reason: "STATUS_OR_PAYMENT_NOT_ALLOWED" | "TOO_CLOSE_TO_DEPARTURE" };

function startOfLocalDay(value: Date) {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function evaluateCancelBooking(
  status: string,
  paymentStatus: string,
  departureDate?: string | Date | null,
  options?: CancelBookingOptions,
): CancelBookingDecision {
  // Rule 1: chỉ cho hủy online khi đơn chưa hoàn tất và chưa thanh toán.
  const isCancelableStatus = status === "PENDING" || status === "CONFIRMED";
  const isUnpaid = paymentStatus === "UNPAID";
  if (!(isCancelableStatus && isUnpaid)) {
    return { allowed: false, reason: "STATUS_OR_PAYMENT_NOT_ALLOWED" };
  }

  // Rule 2: phải hủy trước ngày khởi hành tối thiểu N ngày.
  if (departureDate) {
    const departure = departureDate instanceof Date ? departureDate : new Date(departureDate);
    if (!Number.isNaN(departure.getTime())) {
      const now = options?.now ?? new Date();
      const minDays = options?.minDaysBeforeDeparture ?? DEFAULT_MIN_DAYS_BEFORE_DEPARTURE;
      const departureDay = startOfLocalDay(departure).getTime();
      const today = startOfLocalDay(now).getTime();
      const dayDiff = Math.floor((departureDay - today) / (24 * 60 * 60 * 1000));

      if (dayDiff < minDays) {
        return { allowed: false, reason: "TOO_CLOSE_TO_DEPARTURE" };
      }
    }
  }

  return { allowed: true };
}

export function canCancelBooking(
  status: string,
  paymentStatus: string,
  departureDate?: string | Date | null,
  options?: CancelBookingOptions,
) {
  return evaluateCancelBooking(status, paymentStatus, departureDate, options).allowed;
}
