"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TourStatusValue = "ACTIVE" | "INACTIVE";

type LocationOption = {
  id: string;
  name: string;
  slug: string;
};

type AdminCreateTourFormProps = {
  locations: LocationOption[];
};

export function AdminCreateTourForm({ locations }: AdminCreateTourFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<TourStatusValue>("ACTIVE");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      shortDescription: String(formData.get("shortDescription") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: Number(formData.get("price") ?? 0),
      discountPrice: formData.get("discountPrice") ? Number(formData.get("discountPrice")) : null,
      durationDays: Number(formData.get("durationDays") ?? 0),
      durationNights: Number(formData.get("durationNights") ?? 0),
      maxGuests: Number(formData.get("maxGuests") ?? 0),
      transportation: String(formData.get("transportation") ?? ""),
      departureLocation: String(formData.get("departureLocation") ?? ""),
      featuredImage: String(formData.get("featuredImage") ?? ""),
      locationId: String(formData.get("locationId") ?? ""),
      status,
      featured,
    };

    startTransition(async () => {
      const response = await fetch("/api/admin/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Không thể tạo tour.");
        return;
      }

      toast.success(data.message ?? "Tạo tour thành công.");
      (event.currentTarget as HTMLFormElement).reset();
      setFeatured(false);
      setStatus("ACTIVE");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="iv-card grid gap-3 p-4 md:grid-cols-3">
      <h3 className="md:col-span-3 text-base font-semibold text-slate-900">Thêm tour mới</h3>
      <input name="title" placeholder="Tên tour" className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2" />
      <input name="slug" placeholder="Slug tour" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <select name="locationId" defaultValue="" className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
        <option value="">Chọn điểm đến</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <input name="departureLocation" placeholder="Điểm khởi hành" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="transportation" placeholder="Phương tiện" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="shortDescription" placeholder="Mô tả ngắn" className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3" />
      <input name="description" placeholder="Mô tả chi tiết" className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3" />
      <input name="featuredImage" placeholder="Ảnh đại diện" className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3" />
      <input name="price" type="number" placeholder="Giá gốc" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="discountPrice" type="number" placeholder="Giá khuyến mãi (tuỳ chọn)" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="maxGuests" type="number" placeholder="Số khách tối đa" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="durationDays" type="number" placeholder="Số ngày" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="durationNights" type="number" placeholder="Số đêm" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <select value={status} onChange={(event) => setStatus(event.target.value as TourStatusValue)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
        <option value="ACTIVE">Đang hoạt động</option>
        <option value="INACTIVE">Ngừng hoạt động</option>
      </select>
      <label className="inline-flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
        <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
        Đánh dấu tour nổi bật
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 md:col-span-3 md:justify-self-end"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tạo
          </>
        ) : (
          "Tạo tour"
        )}
      </button>
    </form>
  );
}
