import { redirect } from "next/navigation";
import { buildAliasRedirectPath, type AliasSearchParams } from "@/lib/utils/alias-redirect";

type ContactAliasPageProps = {
  searchParams: Promise<AliasSearchParams>;
};

export default async function ContactAliasPage({ searchParams }: ContactAliasPageProps) {
  const params = await searchParams;
  redirect(buildAliasRedirectPath("/lien-he", params));
}
