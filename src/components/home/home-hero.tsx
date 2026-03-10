import Link from "next/link";

type HeroLocation = {
  id: string;
  name: string;
  slug: string;
};

type HeroStats = {
  totalTours: number;
  totalLocations: number;
  totalBookings: number;
  totalReviews: number;
};

type HomeHeroProps = {
  featuredLocations: HeroLocation[];
  stats: HeroStats;
};

export function HomeHero({ featuredLocations, stats }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-slate-950 text-white">
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover opacity-45"
          poster="/immerse-vietnam/images/header-bg.jpg"
        >
          <source src="/immerse-vietnam/videos/VN.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-black/78 via-slate-900/70 to-teal-950/70" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-20 pt-20 md:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 lg:pb-24 lg:pt-24">
        <div className="space-y-7 iv-fade-up">
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
            Leave Your Footprints
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Dat tour Viet Nam theo phong cach premium, ro rang va de mo rong.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
            Giu tinh than thiet ke cua Immerse Vietnam va nang cap thanh mot booking platform hoan chinh cho tour,
            diem den, review, yeu thich va hanh trinh chi tiet.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/tours" className="iv-btn-primary inline-flex h-11 items-center px-6 text-sm font-semibold">
              Kham pha tours
            </Link>
            <Link href="/destinations" className="iv-btn-soft inline-flex h-11 items-center px-6 text-sm font-semibold">
              Xem diem den
            </Link>
          </div>

          <div className="grid max-w-2xl grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/20 bg-white/8 px-4 py-3">
              <p className="text-2xl font-bold">{stats.totalTours}+</p>
              <p className="text-xs text-slate-300">Tours dang mo</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/8 px-4 py-3">
              <p className="text-2xl font-bold">{stats.totalLocations}+</p>
              <p className="text-xs text-slate-300">Diem den</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/8 px-4 py-3">
              <p className="text-2xl font-bold">{stats.totalBookings}+</p>
              <p className="text-xs text-slate-300">Luot dat tour</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/8 px-4 py-3">
              <p className="text-2xl font-bold">{stats.totalReviews}+</p>
              <p className="text-xs text-slate-300">Danh gia that</p>
            </div>
          </div>
        </div>

        <div className="iv-glass h-fit rounded-3xl p-5 shadow-2xl iv-fade-up lg:p-6">
          <h2 className="text-xl font-bold text-white">Tim nhanh tour phu hop</h2>
          <p className="mt-2 text-sm text-slate-100/90">Loc theo diem den, khoang gia va nhu cau du lich cua ban.</p>
          <form action="/tours" className="mt-5 space-y-3">
            <div>
              <label htmlFor="hero-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
                Tu khoa
              </label>
              <input
                id="hero-search"
                name="search"
                placeholder="Vi du: bien, Da Nang, nghi duong"
                className="h-11 w-full rounded-xl border border-white/30 bg-white/10 px-3 text-sm text-white placeholder:text-slate-300 focus:border-teal-300 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="hero-location" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
                Diem den
              </label>
              <select
                id="hero-location"
                name="location"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-white/30 bg-white/10 px-3 text-sm text-white focus:border-teal-300 focus:outline-none"
              >
                <option value="" className="text-slate-900">
                  Tat ca diem den
                </option>
                {featuredLocations.map((location) => (
                  <option key={location.id} value={location.slug} className="text-slate-900">
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="hero-min-price"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-100"
                >
                  Gia tu
                </label>
                <input
                  id="hero-min-price"
                  name="minPrice"
                  type="number"
                  placeholder="1000000"
                  className="h-11 w-full rounded-xl border border-white/30 bg-white/10 px-3 text-sm text-white placeholder:text-slate-300 focus:border-teal-300 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="hero-max-price"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-100"
                >
                  Den
                </label>
                <input
                  id="hero-max-price"
                  name="maxPrice"
                  type="number"
                  placeholder="5000000"
                  className="h-11 w-full rounded-xl border border-white/30 bg-white/10 px-3 text-sm text-white placeholder:text-slate-300 focus:border-teal-300 focus:outline-none"
                />
              </div>
            </div>
            <button type="submit" className="iv-btn-primary inline-flex h-11 w-full items-center justify-center text-sm font-semibold">
              Tim tour ngay
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
