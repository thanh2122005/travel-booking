"use client";

import { DragEvent, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SafeImage } from "@/components/common/safe-image";

type GalleryItem = {
  id: string;
  url: string;
};

type AdminLocationGalleryManagerProps = {
  locationId: string;
  imageUrl: string;
  gallery: string[];
};

function sanitizeGallery(imageUrl: string, gallery: string[]) {
  return Array.from(new Set([imageUrl, ...gallery].map((image) => image.trim()).filter(Boolean)));
}

function toItems(imageUrl: string, gallery: string[]) {
  return sanitizeGallery(imageUrl, gallery).map((url, index) => ({
    id: `gallery_${index}_${url}`,
    url,
  }));
}

function moveById(items: GalleryItem[], dragId: string, targetId: string) {
  if (dragId === targetId) return items;
  const dragIndex = items.findIndex((item) => item.id === dragId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (dragIndex < 0 || targetIndex < 0) return items;

  const next = [...items];
  const [moved] = next.splice(dragIndex, 1);
  if (!moved) return items;
  next.splice(targetIndex, 0, moved);
  return next;
}

function moveByStep(items: GalleryItem[], id: string, delta: -1 | 1) {
  const index = items.findIndex((item) => item.id === id);
  const targetIndex = index + delta;
  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
  return next;
}

export function AdminLocationGalleryManager({
  locationId,
  imageUrl,
  gallery,
}: AdminLocationGalleryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  const initialItems = useMemo(() => toItems(imageUrl, gallery), [gallery, imageUrl]);
  const [items, setItems] = useState<GalleryItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const hasChanged = useMemo(() => {
    const before = initialItems.map((item) => item.url).join("|");
    const after = items.map((item) => item.url.trim()).join("|");
    return before !== after;
  }, [initialItems, items]);

  function handleAddImage() {
    const trimmed = newImageUrl.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập URL ảnh.");
      return;
    }
    if (items.some((item) => item.url === trimmed)) {
      toast.error("Ảnh đã tồn tại trong gallery.");
      return;
    }
    setItems((current) => [...current, { id: `gallery_new_${Date.now()}`, url: trimmed }]);
    setNewImageUrl("");
  }

  function handleUpdateImage(itemId: string, value: string) {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, url: value } : item)),
    );
  }

  function handleDeleteImage(itemId: string) {
    if (items.length <= 1) {
      toast.error("Gallery phải còn ít nhất 1 ảnh.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function handleDragStart(itemId: string, event: DragEvent<HTMLElement>) {
    setDraggingId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function handleDrop(targetId: string, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const dragged = event.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    if (!dragged) return;
    setItems((current) => moveById(current, dragged, targetId));
  }

  function handleSaveGallery() {
    const payload = Array.from(new Set(items.map((item) => item.url.trim()).filter(Boolean)));
    if (!payload.length) {
      toast.error("Gallery phải có ít nhất 1 ảnh hợp lệ.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/locations/${locationId}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gallery: payload }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Không thể cập nhật gallery điểm đến.");
        return;
      }

      toast.success(data.message ?? "Đã cập nhật gallery điểm đến.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Gallery điểm đến</h3>
          <p className="text-sm text-slate-600">
            Kéo thả để đổi thứ tự ảnh. Ảnh đầu tiên sẽ dùng làm ảnh đại diện của điểm đến.
          </p>
        </div>
        <button
          type="button"
          disabled={isPending || !hasChanged}
          onClick={handleSaveGallery}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Đang lưu
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-4 w-4" />
              Lưu gallery
            </>
          )}
        </button>
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_auto]">
        <input
          value={newImageUrl}
          onChange={(event) => setNewImageUrl(event.target.value)}
          placeholder="Thêm URL ảnh mới vào gallery"
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
        />
        <button
          type="button"
          onClick={handleAddImage}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Thêm ảnh
        </button>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => (
          <article
            key={item.id}
            draggable
            onDragStart={(event) => handleDragStart(item.id, event)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(item.id, event)}
            onDragEnd={() => setDraggingId(null)}
            className={`grid gap-3 rounded-xl border p-3 transition md:grid-cols-[180px_1fr] ${
              draggingId === item.id ? "border-teal-300 bg-teal-50/50" : "border-slate-200"
            }`}
          >
            <div className="relative h-28 overflow-hidden rounded-lg border border-slate-200">
              <SafeImage src={item.url} alt={`Gallery ảnh ${index + 1}`} fill sizes="180px" className="object-cover" />
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
                    onClick={() => setItems((current) => moveByStep(current, item.id, -1))}
                    disabled={index === 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems((current) => moveByStep(current, item.id, 1))}
                    disabled={index === items.length - 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  value={item.url}
                  onChange={(event) => handleUpdateImage(item.id, event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(item.id)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Xóa
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
