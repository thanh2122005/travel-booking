"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";

export function AdminCreateLocationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      provinceOrCity: String(formData.get("provinceOrCity") ?? "").trim(),
      country: String(formData.get("country") ?? "Việt Nam").trim(),
      shortDescription: String(formData.get("shortDescription") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      imageUrl: imageUrl.trim(),
      featured,
    };

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          toast.error(data.message ?? "Không thể tạo điểm đến.");
          return;
        }

        toast.success(data.message ?? "Tạo điểm đến thành công.");
        (event.currentTarget as HTMLFormElement).reset();
        setFeatured(false);
        setImageUrl("");
        router.refresh();
      } catch {
        toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="iv-card grid gap-3 p-4 md:grid-cols-2">
      <h3 className="text-base font-semibold text-slate-900 md:col-span-2">Thêm điểm đến mới</h3>

      <input
        name="name"
        required
        placeholder="Tên điểm đến"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="slug"
        required
        placeholder="Slug (vd: phu-quoc)"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="provinceOrCity"
        required
        placeholder="Tỉnh/Thành phố"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="country"
        defaultValue="Việt Nam"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="shortDescription"
        required
        placeholder="Mô tả ngắn"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
      />
      <textarea
        name="description"
        required
        placeholder="Mô tả chi tiết"
        className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
      />

      <div className="md:col-span-2">
        <AdminImagePicker
          name="imageUrl"
          value={imageUrl}
          onChange={setImageUrl}
          required
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) => setFeatured(event.target.checked)}
        />
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

