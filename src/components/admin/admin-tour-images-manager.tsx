"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Plus, Save, Trash2 } from "lucide-react";
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

function sortByOrder(images: TourImageItem[]) {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

function moveById(images: TourImageItem[], dragId: string, targetId: string) {
  if (dragId === targetId) return images;
  const dragIndex = images.findIndex((item) => item.id === dragId);
  const targetIndex = images.findIndex((item) => item.id === targetId);
  if (dragIndex < 0 || targetIndex < 0) return images;

  const next = [...images];
  const [moved] = next.splice(dragIndex, 1);
  if (!moved) return images;
  next.splice(targetIndex, 0, moved);
  return next;
}

function moveByStep(images: TourImageItem[], id: string, delta: -1 | 1) {
  const index = images.findIndex((item) => item.id === id);
  const targetIndex = index + delta;
  if (index < 0 || targetIndex < 0 || targetIndex >= images.length) return images;
  const next = [...images];
  [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
  return next;
}

export function AdminTourImagesManager({ tourId, images }: AdminTourImagesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(String(images.length + 1));
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);

  const initialOrderedImages = useMemo(() => sortByOrder(images), [images]);
  const [orderedImages, setOrderedImages] = useState<TourImageItem[]>(initialOrderedImages);

  useEffect(() => {
    setOrderedImages(initialOrderedImages);
    setNewSortOrder(String(initialOrderedImages.length + 1));
  }, [initialOrderedImages]);

  const hasOrderChanged = useMemo(() => {
    if (orderedImages.length !== initialOrderedImages.length) {
      return false;
    }
    return orderedImages.some((item, index) => item.id !== initialOrderedImages[index]?.id);
  }, [initialOrderedImages, orderedImages]);

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
      router.refresh();
    });
  }

  function handleSaveOrder() {
    if (!hasOrderChanged) {
      toast("Thứ tự ảnh chưa thay đổi.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/tours/${tourId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderedImages.map((image, index) => ({
            id: image.id,
            sortOrder: index + 1,
          })),
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật thứ tự ảnh.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật thứ tự ảnh.");
      router.refresh();
    });
  }

  function handleUpdateImage(imageId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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

  function handleDragStart(imageId: string, event: DragEvent<HTMLElement>) {
    setDraggingImageId(imageId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", imageId);
  }

  function handleDrop(targetImageId: string, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const dragId = event.dataTransfer.getData("text/plain") || draggingImageId;
    setDraggingImageId(null);
    if (!dragId) return;
    setOrderedImages((current) => moveById(current, dragId, targetImageId));
  }

  function handleMoveStep(imageId: string, delta: -1 | 1) {
    setOrderedImages((current) => moveByStep(current, imageId, delta));
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Ảnh tour</h3>
          <p className="text-sm text-slate-600">
            Kéo thả để đổi thứ tự hiển thị. Ảnh đầu tiên sẽ là ảnh đại diện trên trang công khai.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveOrder}
          disabled={isPending || !hasOrderChanged}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Đang lưu thứ tự
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-4 w-4" />
              Lưu thứ tự ảnh
            </>
          )}
        </button>
      </div>

      <form
        onSubmit={handleCreateImage}
        className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_120px_auto]"
      >
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

      {orderedImages.length ? (
        <div className="grid gap-3">
          {orderedImages.map((image, index) => (
            <article
              key={image.id}
              draggable
              onDragStart={(event) => handleDragStart(image.id, event)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(image.id, event)}
              onDragEnd={() => setDraggingImageId(null)}
              className={`grid gap-3 rounded-xl border p-3 transition md:grid-cols-[180px_1fr] ${
                draggingImageId === image.id
                  ? "border-teal-300 bg-teal-50/50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="relative h-32 overflow-hidden rounded-lg border border-slate-200">
                <SafeImage
                  src={image.imageUrl}
                  alt={`Ảnh tour ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="180px"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <GripVertical className="h-3.5 w-3.5" />
                    Vị trí #{index + 1}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveStep(image.id, -1)}
                      disabled={isPending || index === 0}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStep(image.id, 1)}
                      disabled={isPending || index === orderedImages.length - 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={(event) => handleUpdateImage(image.id, event)}
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
                    defaultValue={index + 1}
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
              </div>
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
