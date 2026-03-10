"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ItineraryItem = {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
};

type AdminItineraryManagerProps = {
  tourId: string;
  itineraries: ItineraryItem[];
};

export function AdminItineraryManager({ tourId, itineraries }: AdminItineraryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newDayNumber, setNewDayNumber] = useState(String(itineraries.length + 1));
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  function handleCreateItinerary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Vui lòng nhập đủ tiêu đề và mô tả lịch trình.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/tours/${tourId}/itineraries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayNumber: Number(newDayNumber),
          title: newTitle.trim(),
          description: newDescription.trim(),
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể thêm lịch trình.");
        return;
      }

      toast.success(payload.message ?? "Đã thêm lịch trình.");
      setNewDayNumber(String(itineraries.length + 2));
      setNewTitle("");
      setNewDescription("");
      router.refresh();
    });
  }

  function handleUpdateItinerary(itineraryId: string, formData: FormData) {
    const dayNumber = Number(formData.get("dayNumber") ?? 1);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    startTransition(async () => {
      const response = await fetch(`/api/admin/itineraries/${itineraryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayNumber,
          title,
          description,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật lịch trình.");
        return;
      }
      toast.success(payload.message ?? "Đã cập nhật lịch trình.");
      router.refresh();
    });
  }

  function handleDeleteItinerary(itineraryId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/itineraries/${itineraryId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể xóa lịch trình.");
        return;
      }
      toast.success(payload.message ?? "Đã xóa lịch trình.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Lịch trình tour</h3>
        <p className="text-sm text-slate-600">
          Quản lý itinerary chi tiết theo từng ngày để hiển thị trên trang tour detail.
        </p>
      </div>

      <form onSubmit={handleCreateItinerary} className="grid gap-3 rounded-xl border border-slate-200 p-3">
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <input
            type="number"
            min={1}
            value={newDayNumber}
            onChange={(event) => setNewDayNumber(event.target.value)}
            placeholder="Ngày"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
          />
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Tiêu đề ngày"
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
          />
        </div>
        <textarea
          value={newDescription}
          onChange={(event) => setNewDescription(event.target.value)}
          placeholder="Mô tả chi tiết cho ngày này..."
          className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
              Thêm lịch trình
            </>
          )}
        </button>
      </form>

      {itineraries.length ? (
        <div className="space-y-3">
          {itineraries.map((item) => (
            <form
              key={item.id}
              action={(formData) => handleUpdateItinerary(item.id, formData)}
              className="space-y-2 rounded-xl border border-slate-200 p-3"
            >
              <div className="grid gap-2 md:grid-cols-[100px_1fr]">
                <input
                  name="dayNumber"
                  type="number"
                  min={1}
                  defaultValue={item.dayNumber}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                />
                <input
                  name="title"
                  defaultValue={item.title}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
              <textarea
                name="description"
                defaultValue={item.description}
                className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  Lưu
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDeleteItinerary(item.id)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Xóa
                </button>
              </div>
            </form>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
          Tour này chưa có itinerary.
        </p>
      )}
    </section>
  );
}
