import { redirect } from "next/navigation";

type LegacyDestinationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function LegacyDestinationsPage({ searchParams }: LegacyDestinationsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);

  if (search) {
    redirect(`/destinations?search=${encodeURIComponent(search)}`);
  }

  redirect("/destinations");
}
