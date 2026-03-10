"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";

type SafeImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK_IMAGE = "/immerse-vietnam/images/header-bg.jpg";

export function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  onError,
  ...props
}: SafeImageProps) {
  const normalizedSrc = src && src.trim().length ? src : fallbackSrc;
  const [activeSrc, setActiveSrc] = useState(normalizedSrc);

  useEffect(() => {
    setActiveSrc(normalizedSrc);
  }, [normalizedSrc]);

  return (
    <Image
      {...props}
      alt={alt}
      src={activeSrc}
      onError={(event) => {
        if (activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
