import { redirect } from "next/navigation";

type DestinationsAliasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function DestinationsAliasPage({ searchParams }: DestinationsAliasPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);

  if (search) {
    redirect(`/dia-diem?search=${encodeURIComponent(search)}`);
  }

  redirect("/dia-diem");
}
