import { redirect } from "next/navigation";
import { buildAliasRedirectPath, type AliasSearchParams } from "@/lib/utils/alias-redirect";

type AboutAliasPageProps = {
  searchParams: Promise<AliasSearchParams>;
};

export default async function AboutAliasPage({ searchParams }: AboutAliasPageProps) {
  const params = await searchParams;
  redirect(buildAliasRedirectPath("/gioi-thieu", params));
}
