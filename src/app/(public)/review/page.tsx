import { redirect } from "next/navigation";
import { buildAliasRedirectPath, type AliasSearchParams } from "@/lib/utils/alias-redirect";

type ReviewAliasPageProps = {
  searchParams: Promise<AliasSearchParams>;
};

export default async function ReviewAliasPage({ searchParams }: ReviewAliasPageProps) {
  const params = await searchParams;
  redirect(buildAliasRedirectPath("/reviews", params));
}
