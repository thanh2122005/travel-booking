"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

type ImageGroup = {
  folder: string;
  images: string[];
};

const imageLibrary: ImageGroup[] = [
  {
    folder: "Đà Lạt",
    images: [
      "/immerse-vietnam/images/DaLat/dalatcover.jpg",
      "/immerse-vietnam/images/DaLat/dalatcoverGOC.jpg",
    ],
  },
  {
    folder: "Đà Nẵng",
    images: [
      "/immerse-vietnam/images/DaNang/DN1.jpg",
      "/immerse-vietnam/images/DaNang/DaNang.jpg",
      "/immerse-vietnam/images/DaNang/danangcover.jpg",
      "/immerse-vietnam/images/DaNang/danangcoverGOC.jpg",
    ],
  },
  {
    folder: "Hà Nội",
    images: [
      "/immerse-vietnam/images/HaNoi/HN1.jpg",
      "/immerse-vietnam/images/HaNoi/HN2.jpg",
      "/immerse-vietnam/images/HaNoi/HN4.jpg",
      "/immerse-vietnam/images/HaNoi/hanoicover.jpg",
    ],
  },
  {
    folder: "Hạ Long",
    images: [
      "/immerse-vietnam/images/HaLong/HL1.webp",
      "/immerse-vietnam/images/HaLong/HL2.webp",
      "/immerse-vietnam/images/HaLong/halongcover.jpg",
    ],
  },
  {
    folder: "Hội An",
    images: [
      "/immerse-vietnam/images/HoiAn/HA1.jpg",
      "/immerse-vietnam/images/HoiAn/HA2.jpg",
      "/immerse-vietnam/images/HoiAn/HA3.jpg",
      "/immerse-vietnam/images/HoiAn/hoiancover.jpg",
    ],
  },
  {
    folder: "Huế",
    images: [
      "/immerse-vietnam/images/Hue/huecover.jpg",
      "/immerse-vietnam/images/Hue/H1.jpeg",
      "/immerse-vietnam/images/Hue/H2.jpg",
    ],
  },
  {
    folder: "Nha Trang",
    images: [
      "/immerse-vietnam/images/NhaTrang/NT1.jpg",
      "/immerse-vietnam/images/NhaTrang/Nt2.jpg",
      "/immerse-vietnam/images/NhaTrang/NT3.jpg",
      "/immerse-vietnam/images/NhaTrang/nhatrangcover.jpg",
    ],
  },
  {
    folder: "Phú Quốc",
    images: [
      "/immerse-vietnam/images/PhuQuoc/PQ1.jpg",
      "/immerse-vietnam/images/PhuQuoc/PQ2.jpg",
      "/immerse-vietnam/images/PhuQuoc/PQ3.jpg",
      "/immerse-vietnam/images/PhuQuoc/PQ4.jpg",
    ],
  },
  {
    folder: "Phú Yên",
    images: [
      "/immerse-vietnam/images/PhuYen/PY1.jpg",
      "/immerse-vietnam/images/PhuYen/PY2.jpg",
      "/immerse-vietnam/images/PhuYen/PY3.jpg",
      "/immerse-vietnam/images/PhuYen/PY5.jpg",
    ],
  },
  {
    folder: "Phú Quý",
    images: [
      "/immerse-vietnam/images/PhuQuy/PQuy1.jpg",
      "/immerse-vietnam/images/PhuQuy/Pquy2.jpg",
      "/immerse-vietnam/images/PhuQuy/Pquy3.jpg",
    ],
  },
  {
    folder: "TP. Hồ Chí Minh",
    images: [
      "/immerse-vietnam/images/HCM/HCM1.jpg",
      "/immerse-vietnam/images/HCM/HCM2.jpg",
      "/immerse-vietnam/images/HCM/HCM3.jpg",
      "/immerse-vietnam/images/HCM/hcmcover.jpg",
    ],
  },
  {
    folder: "Hải Phòng",
    images: [
      "/immerse-vietnam/images/HaiPhong/HP1.jpg",
      "/immerse-vietnam/images/HaiPhong/HP2.jpg",
      "/immerse-vietnam/images/HaiPhong/HP3.jpg",
      "/immerse-vietnam/images/HaiPhong/HP5.jpg",
    ],
  },
];

type AdminImagePickerProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function AdminImagePicker({ name, value, onChange, required }: AdminImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleSelect(imagePath: string) {
    // Chọn ảnh từ thư viện local và đóng modal.
    onChange(imagePath);
    setOpen(false);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    try {
      // Upload ảnh mới lên server và nhận URL trả về.
      const response = await fetch("/api/admin/uploads/tour-image", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        url?: string;
      };

      if (!response.ok || !data.url) {
        toast.error(data.message ?? "Không thể tải ảnh lên.");
        return;
      }

      onChange(data.url);
      setOpen(false);
      toast.success(data.message ?? "Tải ảnh thành công.");
    } catch {
      toast.error("Không thể tải ảnh lên.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <>
      {/* Hidden input để form submit vẫn gửi được URL ảnh đã chọn. */}
      <input type="hidden" name={name} value={value} />

      <div className="md:col-span-3">
        <div className="flex items-center gap-3">
          {value ? (
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200">
              <Image src={value} alt="Ảnh đại diện" fill className="object-cover" sizes="96px" />
            </div>
          ) : null}

          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="/immerse-vietnam/images/my-tour/anh-1.jpg"
              required={required}
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
            />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
            >
              <ImageIcon className="h-4 w-4" />
              Chọn ảnh
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Bạn có thể chọn ảnh có sẵn, tải ảnh mới từ máy tính hoặc tự nhập đường dẫn nếu cần.
        </p>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:col-span-3">
          <div className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Thư viện ảnh</h3>
                <p className="text-xs text-slate-500">
                  Chọn ảnh có sẵn hoặc tải thêm ảnh mới từ máy tính.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Tải ảnh từ máy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-b bg-slate-50 px-5 py-3">
              <div className="text-xs text-slate-600">
                Ảnh tải lên sẽ được lưu vào thư mục{" "}
                <code>/public/immerse-vietnam/images/custom-tours</code> và tự động gán vào tour.
              </div>
            </div>

            <div className="max-h-[calc(85vh-120px)] overflow-y-auto p-5">
              <div className="space-y-6">
                {imageLibrary.map((group) => (
                  <div key={group.folder}>
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">{group.folder}</h4>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {group.images.map((imagePath) => {
                        const isSelected = value === imagePath;
                        return (
                          <button
                            key={imagePath}
                            type="button"
                            onClick={() => handleSelect(imagePath)}
                            className={`group relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                              isSelected
                                ? "border-teal-500 ring-2 ring-teal-500/30"
                                : "border-transparent hover:border-teal-300"
                            }`}
                          >
                            <Image
                              src={imagePath}
                              alt={imagePath.split("/").pop() ?? ""}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                              sizes="(max-width: 640px) 33vw, 20vw"
                            />
                            {isSelected ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-teal-600/40">
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal-700">
                                  Đã chọn
                                </span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

