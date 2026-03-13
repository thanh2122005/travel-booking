import { redirect } from "next/navigation";
import { buildAliasRedirectPath, type AliasSearchParams } from "@/lib/utils/alias-redirect";

type DestinationAliasDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<AliasSearchParams>;
};

export default async function DestinationAliasDetailPage({
  params,
  searchParams,
}: DestinationAliasDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  redirect(buildAliasRedirectPath(`/dia-diem/${slug}`, query));
}
