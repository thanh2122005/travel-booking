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
      const response = await fetch(`/api/admin/tours/${tourId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          featured: selectedFeatured,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật tour.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật tour.");
      router.refresh();
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
      const payload = (await response.json()) as { message?: string };

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
