"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function HomeVideoShowcase() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  return (
    <section className="relative overflow-hidden rounded-[1.9rem] border border-slate-200 bg-slate-900 shadow-xl">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-[460px] w-full object-cover opacity-85 md:h-[560px]"
        poster="/immerse-vietnam/images/thumbnail.png"
        onClick={toggleVideo}
      >
        <source src="/immerse-vietnam/videos/chonoi.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/30" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">Việt Nam chuyển động</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-black leading-tight md:text-4xl">
          Cảm nhận không khí du lịch Việt Nam trước khi chọn tour.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
          Section video từ template cũ được viết lại bằng React hook, không thao tác DOM trực tiếp.
        </p>
      </div>
      <button
        type="button"
        onClick={toggleVideo}
        className="absolute right-5 top-5 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white transition hover:bg-black/70"
        aria-label={isPlaying ? "Tạm dừng video" : "Phát video"}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
    </section>
  );
}
