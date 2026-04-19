"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type BookingPaymentRequestButtonProps = {
  bookingId: string;
  bookingCode: string;
  className?: string;
};

export function BookingPaymentRequestButton({
  bookingId,
  bookingCode,
  className,
}: BookingPaymentRequestButtonProps) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (!confirmed) {
      toast.error("Bạn cần xác nhận đã thanh toán trước khi gửi yêu cầu.");
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/payment-request`, {
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể gửi yêu cầu xác nhận thanh toán.");
        return;
      }

      toast.success(payload.message ?? `Đã ghi nhận yêu cầu thanh toán cho đơn ${bookingCode}.`);
      router.refresh();
    } catch {
      toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 accent-emerald-600"
        />
        <span>Tôi cam kết đã thanh toán cho đơn này và chờ admin xác minh.</span>
      </label>

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          className ??
          "inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
        }
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang gửi yêu cầu...
          </>
        ) : (
          "Tôi đã thanh toán"
        )}
      </button>
    </div>
  );
}
