import { redirect } from "next/navigation";

type LegacyDestinationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyDestinationDetailPage({ params }: LegacyDestinationDetailPageProps) {
  const { slug } = await params;
  redirect(`/destinations/${slug}`);
}
