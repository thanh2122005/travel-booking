"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Maximize2, X } from "lucide-react";
import { SafeImage } from "@/components/common/safe-image";

type TourImageGalleryProps = {
  title: string;
  images: string[];
};

export function TourImageGallery({ title, images }: TourImageGalleryProps) {
  const uniqueImages = useMemo(
    () =>
      Array.from(
        new Set(
          images
            .map((image) => image.trim())
            .filter((image): image is string => Boolean(image)),
        ),
      ),
    [images],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const canNavigate = uniqueImages.length > 1;
  const safeActiveIndex = Math.min(activeIndex, Math.max(uniqueImages.length - 1, 0));
  const activeImage = uniqueImages[safeActiveIndex];

  const goNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (!uniqueImages.length) return 0;
      return (prev + 1) % uniqueImages.length;
    });
  }, [uniqueImages.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (!uniqueImages.length) return 0;
      return (prev - 1 + uniqueImages.length) % uniqueImages.length;
    });
  }, [uniqueImages.length]);

  useEffect(() => {
    if (!isLightboxOpen || !canNavigate) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canNavigate, goNext, goPrev, isLightboxOpen]);

  if (!activeImage) {
    return (
      <div className="rounded-3xl border bg-slate-100 p-8 text-center text-sm text-slate-600">
        <p className="inline-flex items-center gap-2">
          <Images className="h-4 w-4 text-slate-500" />
          Chưa có ảnh cho tour này.
        </p>
      </div>
    );
  }

  return (
    <>
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

          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
              {safeActiveIndex + 1}/{uniqueImages.length}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-black/55 px-3 text-xs font-semibold text-white transition hover:bg-black/70"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Phóng to
            </button>
          </div>

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
                  aria-current={isActive}
                  className={`relative h-24 overflow-hidden rounded-xl border transition ${
                    isActive
                      ? "border-teal-500 ring-2 ring-teal-200"
                      : "border-slate-200 hover:border-slate-400"
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

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/90 px-4 py-5"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh chi tiết"
        >
          <div
            className="mx-auto flex h-full w-full max-w-6xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between text-white">
              <p className="text-sm font-medium">
                {title} · Ảnh {safeActiveIndex + 1}/{uniqueImages.length}
              </p>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label="Đóng ảnh lớn"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/20">
              <SafeImage
                src={activeImage}
                alt={`${title} - ảnh lớn ${safeActiveIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />

              {canNavigate ? (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                    aria-label="Ảnh tiếp theo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>

            {canNavigate ? (
              <div className="mt-3 grid max-h-[160px] grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-7 lg:grid-cols-9">
                {uniqueImages.map((image, index) => {
                  const isActive = index === safeActiveIndex;
                  return (
                    <button
                      key={`${image}-modal-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-16 overflow-hidden rounded-lg border transition ${
                        isActive ? "border-teal-300 ring-2 ring-teal-300/40" : "border-white/30"
                      }`}
                      aria-label={`Xem ảnh lớn ${index + 1}`}
                    >
                      <SafeImage
                        src={image}
                        alt={`${title} - thumbnail modal ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
