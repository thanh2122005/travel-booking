"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { SafeImage } from "@/components/common/safe-image";

type TourImageGalleryProps = {
  title: string;
  images: string[];
};

export function TourImageGallery({ title, images }: TourImageGalleryProps) {
  const uniqueImages = useMemo(
    () => Array.from(new Set(images.filter((image): image is string => Boolean(image && image.trim())))),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  if (!uniqueImages.length) {
    return (
      <div className="rounded-3xl border bg-slate-100 p-8 text-center text-sm text-slate-600">
        <p className="inline-flex items-center gap-2">
          <Images className="h-4 w-4 text-slate-500" />
          Chưa có ảnh cho tour này.
        </p>
      </div>
    );
  }

  const safeActiveIndex = Math.min(activeIndex, uniqueImages.length - 1);
  const activeImage = uniqueImages[safeActiveIndex]!;
  const canNavigate = uniqueImages.length > 1;

  const goNext = () => {
    setActiveIndex((prev) => {
      const current = Math.min(prev, uniqueImages.length - 1);
      return (current + 1) % uniqueImages.length;
    });
  };

  const goPrev = () => {
    setActiveIndex((prev) => {
      const current = Math.min(prev, uniqueImages.length - 1);
      return (current - 1 + uniqueImages.length) % uniqueImages.length;
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative h-[380px] overflow-hidden rounded-3xl border shadow-sm">
        <SafeImage
          src={activeImage}
          alt={`${title} - ảnh ${safeActiveIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 70vw"
          priority
        />
        {canNavigate ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {canNavigate ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {uniqueImages.map((image, index) => {
            const isActive = index === safeActiveIndex;
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-24 overflow-hidden rounded-xl border transition ${
                  isActive ? "border-teal-500 ring-2 ring-teal-200" : "border-slate-200 hover:border-slate-400"
                }`}
                aria-label={`Xem ảnh ${index + 1}`}
              >
                <SafeImage
                  src={image}
                  alt={`${title} - thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 20vw"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
