import { redirect } from "next/navigation";
import { buildAliasRedirectPath, type AliasSearchParams } from "@/lib/utils/alias-redirect";

type FavoriteAliasPageProps = {
  searchParams: Promise<AliasSearchParams>;
};

export default async function FavoriteAliasPage({ searchParams }: FavoriteAliasPageProps) {
  const params = await searchParams;
  redirect(buildAliasRedirectPath("/favorites", params));
}
