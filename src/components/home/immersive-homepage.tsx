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
  return (
    <div className="pb-16">
      <HomeHero featuredLocations={data.featuredLocations} stats={data.stats} />
      <div className="mx-auto mt-10 grid w-full max-w-7xl gap-12 px-4 md:px-6 lg:mt-12 lg:gap-14">
        <HomeFeaturedDestinations locations={data.featuredLocations} />
        <HomeFeaturedTours tours={data.featuredTours} />
        <HomeServices />
        <HomeItineraryPreview tours={data.itineraryPreview} />
        <HomeTestimonials reviews={data.latestReviews} />
        <HomeVideoShowcase />
        <HomeInspiration />
        <HomeCTA />
      </div>
    </div>
  );
}
