"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const locationImageSuggestions = [
  "/immerse-vietnam/images/HaNoi/hanoicover.jpg",
  "/immerse-vietnam/images/DaNang/danangcover.jpg",
  "/immerse-vietnam/images/HoiAn/hoiancover.jpg",
  "/immerse-vietnam/images/Hue/huecover.jpg",
  "/immerse-vietnam/images/NhaTrang/nhatrangcover.jpg",
  "/immerse-vietnam/images/PQ.jpg",
  "/immerse-vietnam/images/DaLat/dalatcover.jpg",
  "/immerse-vietnam/images/HaLong/halongcover.jpg",
  "/immerse-vietnam/images/HCM/hcmcover.jpg",
  "/immerse-vietnam/images/HaiPhong/HP1.jpg",
  "/immerse-vietnam/images/PhuYen/PY1.jpg",
  "/immerse-vietnam/images/PhuQuy/PQuy1.jpg",
] as const;

export function AdminCreateLocationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [featured, setFeatured] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      provinceOrCity: String(formData.get("provinceOrCity") ?? ""),
      country: String(formData.get("country") ?? "Việt Nam"),
      shortDescription: String(formData.get("shortDescription") ?? ""),
      description: String(formData.get("description") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      featured,
    };

    startTransition(async () => {
      const response = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Không thể tạo điểm đến.");
        return;
      }

      toast.success(data.message ?? "Tạo điểm đến thành công.");
      (event.currentTarget as HTMLFormElement).reset();
      setFeatured(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="iv-card grid gap-3 p-4 md:grid-cols-2">
      <h3 className="md:col-span-2 text-base font-semibold text-slate-900">Thêm điểm đến mới</h3>
      <input name="name" required placeholder="Tên điểm đến" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="slug" required placeholder="Slug (vd: phu-quoc)" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="provinceOrCity" required placeholder="Tỉnh/Thành phố" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="country" defaultValue="Việt Nam" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
      <input name="shortDescription" required placeholder="Mô tả ngắn" className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2" />
      <textarea
        name="description"
        required
        placeholder="Mô tả chi tiết"
        className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
      />
      <input
        name="imageUrl"
        required
        list="location-image-options"
        placeholder="URL ảnh đại diện (gợi ý từ thư viện local)"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
      />
      <datalist id="location-image-options">
        {locationImageSuggestions.map((imagePath) => (
          <option key={imagePath} value={imagePath} />
        ))}
      </datalist>
      <p className="md:col-span-2 text-xs text-slate-500">
        Gợi ý: chọn ảnh trong `public/immerse-vietnam/images` để hiển thị ổn định ngay cả khi mạng chặn ảnh ngoài.
      </p>
      <label className="inline-flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
        Đánh dấu nổi bật
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 md:justify-self-end"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tạo
          </>
        ) : (
          "Tạo điểm đến"
        )}
      </button>
    </form>
  );
}
