"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SafeImage } from "@/components/common/safe-image";

const defaultLocationImageSuggestions = [
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

type LocationDetailForForm = {
  id: string;
  name: string;
  slug: string;
  provinceOrCity: string;
  country: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  featured: boolean;
};

type AdminLocationContentFormProps = {
  location: LocationDetailForForm;
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminLocationContentForm({ location }: AdminLocationContentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(location.name);
  const [slug, setSlug] = useState(location.slug);
  const [featured, setFeatured] = useState(location.featured);
  const [imageUrl, setImageUrl] = useState(location.imageUrl);

  const imageSuggestions = useMemo(
    () =>
      Array.from(
        new Set([imageUrl, ...location.gallery, ...defaultLocationImageSuggestions]),
      ).filter(Boolean),
    [imageUrl, location.gallery],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      provinceOrCity: String(formData.get("provinceOrCity") ?? "").trim(),
      country: String(formData.get("country") ?? "").trim(),
      shortDescription: String(formData.get("shortDescription") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      imageUrl: String(formData.get("imageUrl") ?? "").trim(),
      featured,
    };

    startTransition(async () => {
      const response = await fetch(`/api/admin/locations/${location.id}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Không thể cập nhật điểm đến.");
        return;
      }

      toast.success(data.message ?? "Đã cập nhật điểm đến.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Nội dung điểm đến</h2>
        <p className="text-sm text-slate-600">
          Chỉnh sửa thông tin hiển thị trên trang điểm đến: tiêu đề, mô tả, tỉnh/thành và ảnh đại diện.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
        <input
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tên điểm đến"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
        />
        <div className="flex gap-2">
          <input
            name="slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Slug"
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => setSlug(normalizeSlug(name))}
            className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Tạo slug
          </button>
        </div>
        <input
          name="provinceOrCity"
          required
          defaultValue={location.provinceOrCity}
          placeholder="Tỉnh/Thành phố"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          name="country"
          required
          defaultValue={location.country}
          placeholder="Quốc gia"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
          />
          Đánh dấu điểm đến nổi bật
        </label>
        <input
          name="shortDescription"
          required
          defaultValue={location.shortDescription}
          placeholder="Mô tả ngắn"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3"
        />
        <textarea
          name="description"
          required
          defaultValue={location.description}
          placeholder="Mô tả chi tiết"
          className="min-h-28 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-3"
        />
        <div className="md:col-span-2">
          <input
            name="imageUrl"
            required
            list="location-image-options-edit"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Ảnh đại diện điểm đến"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <datalist id="location-image-options-edit">
            {imageSuggestions.map((imagePath) => (
              <option key={imagePath} value={imagePath} />
            ))}
          </datalist>
        </div>
        <div className="relative h-20 overflow-hidden rounded-xl border border-slate-200">
          <SafeImage src={imageUrl} alt={location.name} fill sizes="240px" className="object-cover" />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 md:col-span-3 md:justify-self-end"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-4 w-4" />
              Lưu nội dung điểm đến
            </>
          )}
        </button>
      </form>
    </section>
  );
}
