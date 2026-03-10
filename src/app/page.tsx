import { PublicShell } from "@/components/layout/public-shell";
import { ImmersiveHomePage } from "@/components/home/immersive-homepage";
import { getHomePublicData } from "@/lib/db/public-queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomePublicData().catch(() => ({
    featuredLocations: [],
    featuredTours: [],
    latestReviews: [],
    itineraryPreview: [],
    stats: {
      totalTours: 0,
      totalLocations: 0,
      totalBookings: 0,
      totalReviews: 0,
    },
  }));

  return (
    <PublicShell fullWidth mainClassName="p-0">
      <ImmersiveHomePage data={data} />
    </PublicShell>
  );
}
