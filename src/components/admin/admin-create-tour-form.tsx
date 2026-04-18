"use client";

import { ChangeEvent, FormEvent, useRef, useState, useTransition } from "react";
import { ExternalLink, Loader2, Plus, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";

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

type ItineraryDraft = {
  title: string;
  description: string;
};

type AdminCreateTourFormProps = {
  locations: LocationOption[];
};

export function AdminCreateTourForm({ locations }: AdminCreateTourFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<TourStatusValue>("ACTIVE");
  const [featuredImage, setFeaturedImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([""]);
  const [itineraries, setItineraries] = useState<ItineraryDraft[]>([
    { title: "", description: "" },
  ]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryUploadInputRef = useRef<HTMLInputElement | null>(null);

  function updateGalleryImage(index: number, value: string) {
    // Cập nhật 1 URL ảnh trong danh sách gallery.
    setGalleryImages((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function addGalleryImage() {
    setGalleryImages((current) => [...current, ""]);
  }

  function removeGalleryImage(index: number) {
    setGalleryImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateItinerary(index: number, field: keyof ItineraryDraft, value: string) {
    setItineraries((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItinerary() {
    setItineraries((current) => [...current, { title: "", description: "" }]);
  }

  function removeItinerary(index: number) {
    setItineraries((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function uploadImage(file: File) {
    // Upload ảnh qua API admin, trả về URL public để lưu vào tour.
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/uploads/tour-image", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      url?: string;
    };

    if (!response.ok || !data.url) {
      throw new Error(data.message ?? "Không thể tải ảnh lên.");
    }

    return data.url;
  }

  async function handleGalleryUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    // UX note: khóa nút khi đang upload để tránh bấm lặp.
    setIsUploadingGallery(true);
    try {
      const uploadedUrls: string[] = [];
      // Upload tuần tự để dễ kiểm soát lỗi từng file.
      for (const file of files) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }

      setGalleryImages((current) => {
        // Loại bỏ item rỗng rồi gộp thêm các ảnh mới.
        const normalizedCurrent = current.map((item) => item.trim()).filter(Boolean);
        const next = [...normalizedCurrent, ...uploadedUrls];
        return next.length ? next : [""];
      });

      toast.success(`Đã tải ${uploadedUrls.length} ảnh chi tiết.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh chi tiết.");
    } finally {
      setIsUploadingGallery(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // FormData giúp gom dữ liệu từ input native đơn giản.
    const formData = new FormData(event.currentTarget);
    // Gallery được quản lý bằng state riêng, nên normalize trước khi gửi.
    const normalizedGalleryImages = galleryImages.map((item) => item.trim()).filter(Boolean);

    const itineraryDrafts = itineraries.map((item, index) => ({
      dayNumber: index + 1,
      title: item.title.trim(),
      description: item.description.trim(),
    }));

    const incompleteItinerary = itineraryDrafts.find(
      (item) => (item.title && !item.description) || (!item.title && item.description),
    );
    // Chặn trạng thái "điền nửa vời" để tránh tạo dữ liệu lịch trình bẩn.
    if (incompleteItinerary) {
      toast.error(
        `Vui lòng nhập đủ tiêu đề và mô tả cho ngày ${incompleteItinerary.dayNumber}.`,
      );
      return;
    }

    const normalizedItineraries = itineraryDrafts.filter(
      (item) => item.title && item.description,
    );

    if (!featuredImage.trim()) {
      toast.error("Vui lòng chọn ảnh nổi bật cho tour.");
      return;
    }

    if (!normalizedItineraries.length) {
      toast.error("Vui lòng thêm ít nhất 1 ngày lịch trình.");
      return;
    }

    // Payload gửi lên API admin/tours sau khi normalize dữ liệu form.
    // Các field số ép Number ở client để route validate rõ ràng hơn.
    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      shortDescription: String(formData.get("shortDescription") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      price: Number(formData.get("price") ?? 0),
      discountPrice: formData.get("discountPrice") ? Number(formData.get("discountPrice")) : null,
      durationDays: Number(formData.get("durationDays") ?? 0),
      durationNights: Number(formData.get("durationNights") ?? 0),
      singleRoomSurchargePerAdult: Number(formData.get("singleRoomSurchargePerAdult") ?? 0),
      maxGuests: Number(formData.get("maxGuests") ?? 0),
      transportation: String(formData.get("transportation") ?? "").trim(),
      departureLocation: String(formData.get("departureLocation") ?? "").trim(),
      featuredImage: featuredImage.trim(),
      images: normalizedGalleryImages,
      itineraries: normalizedItineraries,
      locationId: String(formData.get("locationId") ?? "").trim(),
      status,
      featured,
    };

    if (payload.durationNights > 0 && payload.singleRoomSurchargePerAdult <= 0) {
      toast.error("Tour có lưu trú phải nhập phụ thu phòng đơn lớn hơn 0.");
      return;
    }

    startTransition(async () => {
      try {
        // Gọi API tạo tour và reset form khi thành công.
        const response = await fetch("/api/admin/tours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          toast.error(data.message ?? "Không thể tạo tour.");
          return;
        }

        toast.success(data.message ?? "Tạo tour thành công.");
        (event.currentTarget as HTMLFormElement).reset();
        // Reset state local để lần tạo tiếp theo không dính dữ liệu cũ.
        setFeatured(false);
        setStatus("ACTIVE");
        setFeaturedImage("");
        setGalleryImages([""]);
        // Sau khi tạo tour xong, reset lịch trình về 1 dòng rỗng.
        setItineraries([{ title: "", description: "" }]);
        router.refresh();
      } catch {
        toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="iv-card grid gap-3 p-4 md:grid-cols-3">
      <h3 className="text-base font-semibold text-slate-900 md:col-span-3">Thêm tour mới</h3>

      <input
        name="title"
        required
        placeholder="Tên tour"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
      />
      <input
        name="slug"
        required
        placeholder="Slug tour"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />

      <div className="flex items-center gap-2">
      <select
        name="locationId"
        defaultValue=""
        className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
      >
        <option value="">Chọn điểm đến</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <a
        href="/admin/locations"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        title="Mở trang quản lý điểm đến"
        aria-label="Mở trang quản lý điểm đến"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
      </div>

      <p className="hidden">
        Chưa có điểm đến?{" "}
        <Link href="/admin/locations" className="font-medium text-teal-700 hover:text-teal-600">
          Thêm điểm đến mới
        </Link>{" "}
        rồi quay lại tạo tour.
      </p>

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

      <input
        name="shortDescription"
        required
        placeholder="Mô tả ngắn"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm md:col-span-3"
      />
      <textarea
        name="description"
        required
        placeholder="Mô tả chi tiết"
        className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-3"
      />

      <AdminImagePicker
        name="featuredImage"
        value={featuredImage}
        onChange={setFeaturedImage}
        required
      />

      <div className="space-y-3 rounded-2xl border border-slate-200 p-4 md:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Ảnh chi tiết của tour</p>
            <p className="text-xs text-slate-500">
              Có thể tải nhiều ảnh một lần rồi chỉnh lại từng ảnh nếu cần.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={galleryUploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
            />
            <button
              type="button"
              onClick={() => galleryUploadInputRef.current?.click()}
              disabled={isUploadingGallery}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 text-sm font-medium text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploadingGallery ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Tải nhiều ảnh
                </>
              )}
            </button>
            <button
              type="button"
              onClick={addGalleryImage}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Thêm ô ảnh
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {galleryImages.map((image, index) => (
            <div key={`gallery-image-${index}`} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">Ảnh chi tiết {index + 1}</p>
                {galleryImages.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <AdminImagePicker
                name={`galleryImage-${index}`}
                value={image}
                onChange={(value) => updateGalleryImage(index, value)}
              />
            </div>
          ))}
        </div>
      </div>

      <input
        name="price"
        required
        type="number"
        placeholder="Giá gốc"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="discountPrice"
        type="number"
        placeholder="Giá khuyến mãi (tùy chọn)"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="maxGuests"
        required
        type="number"
        placeholder="Số khách tối đa"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="durationDays"
        required
        type="number"
        placeholder="Số ngày"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="durationNights"
        required
        type="number"
        placeholder="Số đêm"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
      <input
        name="singleRoomSurchargePerAdult"
        required
        type="number"
        min={0}
        defaultValue={0}
        placeholder="Phụ thu phòng đơn / người lớn / đêm"
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
      <p className="text-xs text-slate-500 md:col-span-3">
        Gợi ý: nhập lớn hơn 0 để bật tùy chọn phòng đơn trong form đặt tour.
      </p>
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as TourStatusValue)}
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      >
        <option value="ACTIVE">Đang hoạt động</option>
        <option value="INACTIVE">Ngừng hoạt động</option>
      </select>

      <div className="space-y-3 rounded-2xl border border-slate-200 p-4 md:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Lịch trình chi tiết</p>
            <p className="text-xs text-slate-500">
              Nhập thủ công từng ngày ngay lúc tạo tour.
            </p>
          </div>
          <button
            type="button"
            onClick={addItinerary}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Thêm ngày
          </button>
        </div>

        <div className="space-y-3">
          {itineraries.map((item, index) => (
            <div
              key={`itinerary-${index}`}
              className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[180px_1fr_auto]"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">Ngày {index + 1}</p>
                <input
                  value={item.title}
                  onChange={(event) => updateItinerary(index, "title", event.target.value)}
                  placeholder={`Tiêu đề ngày ${index + 1}`}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <textarea
                value={item.description}
                onChange={(event) => updateItinerary(index, "description", event.target.value)}
                placeholder="Mô tả hoạt động trong ngày"
                className="min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex items-start justify-end">
                {itineraries.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeItinerary(index)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 md:col-span-3">
        Mẹo: ảnh nổi bật dùng cho thẻ tour. Ảnh chi tiết và lịch trình nên nhập đầy đủ để trang
        chi tiết hiển thị đúng.
      </p>

      <label className="inline-flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) => setFeatured(event.target.checked)}
        />
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


