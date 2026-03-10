"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SafeImage } from "@/components/common/safe-image";

type TourImageItem = {
  id: string;
  imageUrl: string;
  sortOrder: number;
};

type AdminTourImagesManagerProps = {
  tourId: string;
  images: TourImageItem[];
};

export function AdminTourImagesManager({ tourId, images }: AdminTourImagesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(String(images.length + 1));

  function handleCreateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newImageUrl.trim()) {
      toast.error("Vui lòng nhập URL ảnh.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/tours/${tourId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: newImageUrl.trim(),
          sortOrder: Number(newSortOrder) || undefined,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể thêm ảnh.");
        return;
      }

      toast.success(payload.message ?? "Đã thêm ảnh tour.");
      setNewImageUrl("");
      setNewSortOrder(String(images.length + 2));
      router.refresh();
    });
  }

  function handleUpdateImage(imageId: string, formData: FormData) {
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    startTransition(async () => {
      const response = await fetch(`/api/admin/tour-images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          sortOrder: Number.isFinite(sortOrder) && sortOrder > 0 ? sortOrder : undefined,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật ảnh.");
        return;
      }
      toast.success(payload.message ?? "Đã cập nhật ảnh.");
      router.refresh();
    });
  }

  function handleDeleteImage(imageId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/tour-images/${imageId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể xóa ảnh.");
        return;
      }
      toast.success(payload.message ?? "Đã xóa ảnh.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Ảnh tour</h3>
        <p className="text-sm text-slate-600">
          Quản lý bộ ảnh hiển thị ở trang chi tiết tour. Ảnh đầu tiên sẽ là ảnh đại diện.
        </p>
      </div>

      <form onSubmit={handleCreateImage} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_120px_auto]">
        <input
          value={newImageUrl}
          onChange={(event) => setNewImageUrl(event.target.value)}
          placeholder="URL ảnh mới"
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
        />
        <input
          type="number"
          min={1}
          value={newSortOrder}
          onChange={(event) => setNewSortOrder(event.target.value)}
          placeholder="Thứ tự"
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Đang thêm
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm ảnh
            </>
          )}
        </button>
      </form>

      {images.length ? (
        <div className="grid gap-3">
          {images.map((image) => (
            <article key={image.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[180px_1fr]">
              <div className="relative h-32 overflow-hidden rounded-lg border border-slate-200">
                <SafeImage src={image.imageUrl} alt={`Ảnh tour ${image.sortOrder}`} fill className="object-cover" sizes="180px" />
              </div>
              <form
                action={(formData) => handleUpdateImage(image.id, formData)}
                className="grid gap-2 md:grid-cols-[1fr_100px_auto_auto]"
              >
                <input
                  name="imageUrl"
                  defaultValue={image.imageUrl}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                />
                <input
                  name="sortOrder"
                  type="number"
                  min={1}
                  defaultValue={image.sortOrder}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  Lưu
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDeleteImage(image.id)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Xóa
                </button>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
          Tour này chưa có ảnh chi tiết.
        </p>
      )}
    </section>
  );
}
