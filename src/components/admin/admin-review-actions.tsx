"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AdminReviewActionsProps = {
  reviewId: string;
  isVisible: boolean;
  compact?: boolean;
};

export function AdminReviewActions({ reviewId, isVisible, compact = false }: AdminReviewActionsProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(isVisible);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisible: visible }),
        });

        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          toast.error(payload.message ?? "Không thể cập nhật đánh giá.");
          return;
        }

        toast.success(payload.message ?? "Đã cập nhật đánh giá.");
        router.refresh();
      } catch {
        toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
      }
    });
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? "w-full max-w-[188px]" : "w-full sm:w-[188px]"}`}>
      <select
        value={visible ? "1" : "0"}
        onChange={(event) => setVisible(event.target.value === "1")}
        className="h-8 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
        disabled={isPending}
      >
        <option value="1">Hiển thị</option>
        <option value="0">Ẩn</option>
      </select>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="inline-flex h-8 items-center justify-center rounded-md bg-teal-600 px-3 text-xs font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            Lưu
          </>
        ) : (
          "Lưu"
        )}
      </button>
    </div>
  );
}

