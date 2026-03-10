import Image from "next/image";

type PageHeroBannerProps = {
  title: string;
  description: string;
  imageSrc?: string;
  videoSrc?: string;
  eyebrow?: string;
};

export function PageHeroBanner({ title, description, imageSrc, videoSrc, eyebrow }: PageHeroBannerProps) {
  return (
    <section className="iv-page-hero">
      <div className="absolute inset-0">
        {videoSrc ? (
          <video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover opacity-80">
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : imageSrc ? (
          <Image src={imageSrc} alt={title} fill className="object-cover opacity-80" sizes="100vw" priority />
        ) : null}
      </div>
      <div className="relative px-5 py-16 md:px-8 md:py-24">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">{eyebrow}</p> : null}
        <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">{description}</p>
      </div>
    </section>
  );
}
