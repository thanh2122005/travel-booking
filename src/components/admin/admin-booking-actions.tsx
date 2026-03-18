"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentStatusValue = "UNPAID" | "PAID";

type AdminBookingActionsProps = {
  bookingId: string;
  status: BookingStatusValue;
  paymentStatus: PaymentStatusValue;
  compact?: boolean;
};

export function AdminBookingActions({ bookingId, status, paymentStatus, compact = false }: AdminBookingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(paymentStatus);

  function handleSave() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus, paymentStatus: selectedPaymentStatus }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật đơn đặt tour.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật đơn đặt tour.");
      router.refresh();
    });
  }

  return (
    <div className={`flex flex-col gap-1.5 ${compact ? "w-full min-w-[112px] max-w-[132px]" : "w-[148px]"}`}>
      <select
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value as BookingStatusValue)}
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
      >
        <option value="PENDING">Chờ xác nhận</option>
        <option value="CONFIRMED">Đã xác nhận</option>
        <option value="CANCELLED">Đã hủy</option>
        <option value="COMPLETED">Hoàn thành</option>
      </select>
      <select
        value={selectedPaymentStatus}
        onChange={(event) => setSelectedPaymentStatus(event.target.value as PaymentStatusValue)}
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
      >
        <option value="UNPAID">Chưa thanh toán</option>
        <option value="PAID">Đã thanh toán</option>
      </select>
      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="inline-flex h-8 w-full items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            Đang lưu
          </>
        ) : (
          "Lưu"
        )}
      </button>
    </div>
  );
}