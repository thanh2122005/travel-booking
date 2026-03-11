import { redirect } from "next/navigation";

type DestinationAliasDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DestinationAliasDetailPage({ params }: DestinationAliasDetailPageProps) {
  const { slug } = await params;
  redirect(`/dia-diem/${slug}`);
}
