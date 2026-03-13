import { redirect } from "next/navigation";
import { buildAliasRedirectPath, type AliasSearchParams } from "@/lib/utils/alias-redirect";

type DestinationsAliasPageProps = {
  searchParams: Promise<AliasSearchParams>;
};

export default async function DestinationsAliasPage({ searchParams }: DestinationsAliasPageProps) {
  const params = await searchParams;
  redirect(buildAliasRedirectPath("/dia-diem", params));
}
