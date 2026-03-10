"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SafeImage } from "@/components/common/safe-image";

const defaultImageSuggestions = [
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
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Nha Trang",
  "Hải Phòng",
] as const;

const transportationSuggestions = [
  "Máy bay + xe du lịch",
  "Xe du lịch",
  "Xe giường nằm",
  "Limousine",
  "Tàu hỏa + xe đưa đón",
] as const;

type TourStatusValue = "ACTIVE" | "INACTIVE";

type LocationOption = {
  id: string;
  name: string;
  slug: string;
};

type TourDetailForForm = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice: number | null;
  durationDays: number;
  durationNights: number;
  maxGuests: number;
  transportation: string;
  departureLocation: string;
  featuredImage: string;
  status: TourStatusValue;
  featured: boolean;
  locationId: string;
  images: Array<{ imageUrl: string }>;
};

type AdminTourContentFormProps = {
  tour: TourDetailForForm;
  locations: LocationOption[];
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

export function AdminTourContentForm({ tour, locations }: AdminTourContentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<TourStatusValue>(tour.status);
  const [featured, setFeatured] = useState(tour.featured);
  const [featuredImage, setFeaturedImage] = useState(tour.featuredImage);
  const [title, setTitle] = useState(tour.title);
  const [slug, setSlug] = useState(tour.slug);

  const imageSuggestions = useMemo(
    () =>
      Array.from(
        new Set([
          featuredImage,
          ...tour.images.map((image) => image.imageUrl),
          ...defaultImageSuggestions,
        ]),
      ).filter(Boolean),
    [featuredImage, tour.images],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const discountRaw = String(formData.get("discountPrice") ?? "").trim();
    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      shortDescription: String(formData.get("shortDescription") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      price: Number(formData.get("price") ?? 0),
      discountPrice: discountRaw.length ? Number(discountRaw) : null,
      durationDays: Number(formData.get("durationDays") ?? 0),
      durationNights: Number(formData.get("durationNights") ?? 0),
      maxGuests: Number(formData.get("maxGuests") ?? 0),
      transportation: String(formData.get("transportation") ?? "").trim(),
      departureLocation: String(formData.get("departureLocation") ?? "").trim(),
      featuredImage: String(formData.get("featuredImage") ?? "").trim(),
      locationId: String(formData.get("locationId") ?? "").trim(),
      status,
      featured,
    };

    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      toast.error("Giá tour phải lớn hơn 0.");
      return;
    }
    if (payload.discountPrice !== null && (!Number.isFinite(payload.discountPrice) || payload.discountPrice <= 0)) {
      toast.error("Giá khuyến mãi không hợp lệ.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/tours/${tour.id}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Không thể cập nhật nội dung tour.");
        return;
      }

      toast.success(data.message ?? "Đã cập nhật nội dung tour.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Nội dung tour tổng thể</h2>
        <p className="text-sm text-slate-600">
          Cập nhật thông tin hiển thị ở trang công khai: tiêu đề, mô tả, giá bán, điểm đến và trạng thái.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
        <input
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Tên tour"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
        />
        <div className="flex gap-2">
          <input
            name="slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Slug tour"
            className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => setSlug(normalizeSlug(title))}
            className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Tạo slug
          </button>
        </div>

        <select
          name="locationId"
          defaultValue={tour.locationId}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <input
          name="departureLocation"
          required
          list="departure-options-edit"
          defaultValue={tour.departureLocation}
          placeholder="Điểm khởi hành"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          name="transportation"
          required
          list="transportation-options-edit"
          defaultValue={tour.transportation}
          placeholder="Phương tiện"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <datalist id="departure-options-edit">
          {departureSuggestions.map((departure) => (
            <option key={departure} value={departure} />
          ))}
        </datalist>
        <datalist id="transportation-options-edit">
          {transportationSuggestions.map((transportation) => (
            <option key={transportation} value={transportation} />
          ))}
        </datalist>

        <input
          name="shortDescription"
          required
          defaultValue={tour.shortDescription}
          placeholder="Mô tả ngắn"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3"
        />
        <textarea
          name="description"
          required
          defaultValue={tour.description}
          placeholder="Mô tả chi tiết"
          className="min-h-28 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-3"
        />

        <div className="md:col-span-2">
          <input
            name="featuredImage"
            required
            list="tour-image-options-edit"
            value={featuredImage}
            onChange={(event) => setFeaturedImage(event.target.value)}
            placeholder="Ảnh đại diện tour"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <datalist id="tour-image-options-edit">
            {imageSuggestions.map((imagePath) => (
              <option key={imagePath} value={imagePath} />
            ))}
          </datalist>
        </div>
        <div className="relative h-20 overflow-hidden rounded-xl border border-slate-200">
          <SafeImage
            src={featuredImage}
            alt="Ảnh đại diện tour"
            fill
            sizes="240px"
            className="object-cover"
          />
        </div>

        <input
          name="price"
          required
          type="number"
          min={1}
          defaultValue={tour.price}
          placeholder="Giá gốc"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          name="discountPrice"
          type="number"
          min={1}
          defaultValue={tour.discountPrice ?? ""}
          placeholder="Giá khuyến mãi (tuỳ chọn)"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          name="maxGuests"
          required
          type="number"
          min={1}
          defaultValue={tour.maxGuests}
          placeholder="Số khách tối đa"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          name="durationDays"
          required
          type="number"
          min={1}
          defaultValue={tour.durationDays}
          placeholder="Số ngày"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          name="durationNights"
          required
          type="number"
          min={0}
          defaultValue={tour.durationNights}
          placeholder="Số đêm"
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as TourStatusValue)}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        >
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
        </select>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
          />
          Đánh dấu là tour nổi bật
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 md:justify-self-end"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-4 w-4" />
              Lưu nội dung tour
            </>
          )}
        </button>
      </form>
    </section>
  );
}
