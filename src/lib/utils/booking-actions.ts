export type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentStatusValue = "UNPAID" | "PAID";

export function canCancelBooking(status: string, paymentStatus: string) {
  const isCancelableStatus = status === "PENDING" || status === "CONFIRMED";
  const isUnpaid = paymentStatus === "UNPAID";
  return isCancelableStatus && isUnpaid;
}
