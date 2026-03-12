"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

type FavoriteTogglePayload = {
  message?: string;
  isFavorite?: boolean;
};

type FavoriteRemoveButtonProps = {
  tourId: string;
  className?: string;
};

export function FavoriteRemoveButton({ tourId, className }: FavoriteRemoveButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tourId }),
      });

      const payload = (await response.json()) as FavoriteTogglePayload;

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật yêu thích lúc này.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật danh sách yêu thích.");
      router.refresh();
    } catch {
      toast.error("Không thể cập nhật yêu thích lúc này.");
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
          <HeartOff className="mr-2 h-4 w-4" />
          Bỏ yêu thích
        </>
      )}
    </button>
  );
}
