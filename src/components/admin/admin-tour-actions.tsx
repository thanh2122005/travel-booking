"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TourStatusValue = "ACTIVE" | "INACTIVE";

type AdminTourActionsProps = {
  tourId: string;
  status: TourStatusValue;
  featured: boolean;
};

export function AdminTourActions({ tourId, status, featured }: AdminTourActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedFeatured, setSelectedFeatured] = useState(featured);

  function handleSave() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/tours/${tourId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: selectedStatus,
            featured: selectedFeatured,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { message?: string };

        if (!response.ok) {
          toast.error(payload.message ?? "\u004b\u0068\u00f4\u006e\u0067 \u0074\u0068\u1ec3 \u0063\u1ead\u0070 \u006e\u0068\u1ead\u0074 \u0074\u006f\u0075\u0072\u002e");
          return;
        }

        toast.success(payload.message ?? "\u0110\u00e3 \u0063\u1ead\u0070 \u006e\u0068\u1ead\u0074 \u0074\u006f\u0075\u0072\u002e");
        router.refresh();
      } catch {
        toast.error("\u004b\u1ebf\u0074 \u006e\u1ed1\u0069 \u0074\u1ea1\u006d \u0074\u0068\u1eddi \u0067\u0069\u00e1\u006e \u0111\u006f\u1ea1\u006e\u002e \u0056\u0075\u0069 \u006c\u00f2\u006e\u0067 \u0074\u0068\u1eed \u006c\u1ea1\u0069\u002e");
      }
    });
  }

  async function handleDeleteTour() {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa tour này? Hành động này sẽ xóa cả booking/review/favorite liên quan.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/tours/${tourId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể xóa tour.");
        return;
      }

      toast.success(payload.message ?? "Đã xóa tour thành công.");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <select
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value as TourStatusValue)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
        disabled={isPending || isDeleting}
      >
        <option value="ACTIVE">Đang hoạt động</option>
        <option value="INACTIVE">Ngừng hoạt động</option>
      </select>
      <label className="inline-flex items-center gap-1 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={selectedFeatured}
          onChange={(event) => setSelectedFeatured(event.target.checked)}
          className="h-3.5 w-3.5"
          disabled={isPending || isDeleting}
        />
        Nổi bật
      </label>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || isDeleting}
        className="inline-flex h-8 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      <button
        type="button"
        onClick={handleDeleteTour}
        disabled={isPending || isDeleting}
        className="inline-flex h-8 items-center justify-center rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            Đang xóa
          </>
        ) : (
          <>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Xóa
          </>
        )}
      </button>
    </div>
  );
}
