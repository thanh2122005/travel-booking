"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AdminLocationActionsProps = {
  locationId: string;
  featured: boolean;
};

export function AdminLocationActions({ locationId, featured }: AdminLocationActionsProps) {
  const router = useRouter();
  const [selectedFeatured, setSelectedFeatured] = useState(featured);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/locations/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: selectedFeatured }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật điểm đến.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật điểm đến.");
      router.refresh();
    });
  }

  async function handleDeleteLocation() {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa điểm đến này? Chỉ có thể xóa khi điểm đến không còn tour.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/locations/${locationId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể xóa điểm đến.");
        return;
      }

      toast.success(payload.message ?? "Đã xóa điểm đến thành công.");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
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
        onClick={handleDeleteLocation}
        disabled={isPending || isDeleting}
        className="inline-flex h-8 items-center justify-center rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            Xóa
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
