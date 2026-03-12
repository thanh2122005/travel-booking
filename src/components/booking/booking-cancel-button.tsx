"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

type BookingCancelPayload = {
  message?: string;
};

type BookingCancelButtonProps = {
  bookingId: string;
  bookingCode: string;
  className?: string;
};

export function BookingCancelButton({
  bookingId,
  bookingCode,
  className,
}: BookingCancelButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (!confirm(`Bạn có chắc muốn hủy đơn ${bookingCode}?`)) {
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });

      const payload = (await response.json()) as BookingCancelPayload;

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể hủy đơn lúc này.");
        return;
      }

      toast.success(payload.message ?? "Đã hủy đơn thành công.");
      router.refresh();
    } catch {
      toast.error("Không thể hủy đơn lúc này.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        className ??
        "inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-70"
      }
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang xử lý...
        </>
      ) : (
        <>
          <Ban className="mr-2 h-4 w-4" />
          Hủy đơn
        </>
      )}
    </button>
  );
}
