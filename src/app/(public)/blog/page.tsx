import { redirect } from "next/navigation";
import { buildAliasRedirectPath, type AliasSearchParams } from "@/lib/utils/alias-redirect";

type BlogAliasPageProps = {
  searchParams: Promise<AliasSearchParams>;
};

export default async function BlogAliasPage({ searchParams }: BlogAliasPageProps) {
  const params = await searchParams;
  redirect(buildAliasRedirectPath("/inspiration", params));
}
