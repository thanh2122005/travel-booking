import { HomeCTA } from "@/components/home/home-cta";
import { HomeFeaturedDestinations } from "@/components/home/home-featured-destinations";
import { HomeFeaturedTours } from "@/components/home/home-featured-tours";
import { HomeHero } from "@/components/home/home-hero";
import { HomeInspiration } from "@/components/home/home-inspiration";
import { HomeItineraryPreview } from "@/components/home/home-itinerary-preview";
import { HomeServices } from "@/components/home/home-services";
import { HomeTestimonials } from "@/components/home/home-testimonials";
import { HomeVideoShowcase } from "@/components/home/home-video-showcase";
import { getHomePublicData } from "@/lib/db/public-queries";

type HomePageData = Awaited<ReturnType<typeof getHomePublicData>>;

type ImmersiveHomePageProps = {
  data: HomePageData;
};

export function ImmersiveHomePage({ data }: ImmersiveHomePageProps) {
  const quickLinks = [
    { href: "#diem-den-noi-bat", label: "Điểm đến" },
    { href: "#tour-noi-bat", label: "Tour nổi bật" },
    { href: "#danh-gia-khach-hang", label: "Đánh giá" },
    { href: "#cam-hung-du-lich", label: "Cảm hứng" },
  ] as const;

  return (
    <div className="pb-24 lg:pb-16">
      <HomeHero featuredLocations={data.featuredLocations} stats={data.stats} />
      <div className="mx-auto mt-10 grid w-full max-w-7xl gap-12 px-4 md:px-6 lg:mt-12 lg:gap-14">
        <section className="iv-card p-4 md:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Khám phá nhanh</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {quickLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>

        <div id="diem-den-noi-bat" className="scroll-mt-24">
          <HomeFeaturedDestinations locations={data.featuredLocations} />
        </div>
        <div id="tour-noi-bat" className="scroll-mt-24">
          <HomeFeaturedTours tours={data.featuredTours} />
        </div>
        <HomeServices />
        <HomeItineraryPreview tours={data.itineraryPreview} />
        <div id="danh-gia-khach-hang" className="scroll-mt-24">
          <HomeTestimonials reviews={data.latestReviews} />
        </div>
        <HomeVideoShowcase />
        <div id="cam-hung-du-lich" className="scroll-mt-24">
          <HomeInspiration locations={data.featuredLocations} />
        </div>
        <HomeCTA />
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur md:hidden">
        <a
          href="#diem-den-noi-bat"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Điểm đến
        </a>
        <a
          href="#tour-noi-bat"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Tour
        </a>
        <a
          href="#danh-gia-khach-hang"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
        >
          Đánh giá
        </a>
      </div>
    </div>
  );
}
