"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ReviewRemovePayload = {
  message?: string;
};

type ReviewRemoveButtonProps = {
  tourId: string;
  className?: string;
};

export function ReviewRemoveButton({ tourId, className }: ReviewRemoveButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (!confirm("Bạn chắc chắn muốn xóa đánh giá này?")) {
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tourId }),
      });

      const payload = (await response.json()) as ReviewRemovePayload;

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể xóa đánh giá lúc này.");
        return;
      }

      toast.success(payload.message ?? "Đã xóa đánh giá.");
      router.refresh();
    } catch {
      toast.error("Không thể xóa đánh giá lúc này.");
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
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa đánh giá
        </>
      )}
    </button>
  );
}
