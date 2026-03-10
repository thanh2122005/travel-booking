"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const tourImageSuggestions = [
  "/immerse-vietnam/images/DaNang/DN1.jpg",
  "/immerse-vietnam/images/HaNoi/HN1.jpg",
  "/immerse-vietnam/images/HaLong/HL1.webp",
  "/immerse-vietnam/images/HoiAn/HA1.jpg",
  "/immerse-vietnam/images/Hue/huecover.jpg",
  "/immerse-vietnam/images/NhaTrang/NT1.jpg",
  "/immerse-vietnam/images/PhuQuoc/PQ1.jpg",
  "/immerse-vietnam/images/DaLat/dalatcover.jpg",
  "/immerse-vietnam/images/HCM/HCM1.jpg",
  "/immerse-vietnam/images/HaiPhong/HP1.jpg",
  "/immerse-vietnam/images/PhuYen/PY1.jpg",
  "/immerse-vietnam/images/PhuQuy/PQuy1.jpg",
] as const;

const departureSuggestions = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Nha Trang",
  "Hải Phòng",
] as const;

const transportationSuggestions = [
  "Máy bay + xe du lịch",
  "Xe du lịch",
  "Xe giường nằm",
  "Limousine",
  "Xe du lịch + tàu cao tốc",
] as const;

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
      <input name="title" required placeholder="Tên tour" className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2" />
      <input name="slug" required placeholder="Slug tour" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <select name="locationId" defaultValue="" className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
        <option value="">Chọn điểm đến</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <input
        name="departureLocation"
        required
        list="departure-options"
        placeholder="Điểm khởi hành"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
      <datalist id="departure-options">
        {departureSuggestions.map((departure) => (
          <option key={departure} value={departure} />
        ))}
      </datalist>
      <input
        name="transportation"
        required
        list="transportation-options"
        placeholder="Phương tiện"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
      <datalist id="transportation-options">
        {transportationSuggestions.map((transportation) => (
          <option key={transportation} value={transportation} />
        ))}
      </datalist>
      <input name="shortDescription" required placeholder="Mô tả ngắn" className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3" />
      <textarea
        name="description"
        required
        placeholder="Mô tả chi tiết"
        className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-3"
      />
      <input
        name="featuredImage"
        required
        list="tour-image-options"
        placeholder="Ảnh đại diện (gợi ý từ thư viện local)"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3"
      />
      <datalist id="tour-image-options">
        {tourImageSuggestions.map((imagePath) => (
          <option key={imagePath} value={imagePath} />
        ))}
      </datalist>
      <input name="price" required type="number" placeholder="Giá gốc" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="discountPrice" type="number" placeholder="Giá khuyến mãi (tuỳ chọn)" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="maxGuests" required type="number" placeholder="Số khách tối đa" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="durationDays" required type="number" placeholder="Số ngày" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="durationNights" required type="number" placeholder="Số đêm" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <select value={status} onChange={(event) => setStatus(event.target.value as TourStatusValue)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
        <option value="ACTIVE">Đang hoạt động</option>
        <option value="INACTIVE">Ngừng hoạt động</option>
      </select>
      <p className="md:col-span-3 text-xs text-slate-500">
        Mẹo: dùng đường dẫn ảnh local để tour hiển thị ổn định trong môi trường dev/offline.
      </p>
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
