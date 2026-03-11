import Link from "next/link";
import { AdminCreateLocationForm } from "@/components/admin/admin-create-location-form";
import { AdminLocationActions } from "@/components/admin/admin-location-actions";
import { SafeImage } from "@/components/common/safe-image";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { getAdminLocations } from "@/lib/db/admin-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminLocationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function AdminLocationsPage({ searchParams }: AdminLocationsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const page = Number(normalizeParam(params.page) || "1");

  const data = await getAdminLocations({
    search: search || undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 12,
  }).catch(() => null);

  if (!data) {
    return (
      <EmptyState
        title="KhÃ´ng thá»ƒ táº£i danh sÃ¡ch Ä‘iá»ƒm Ä‘áº¿n"
        description="Vui lÃ²ng kiá»ƒm tra káº¿t ná»‘i cÆ¡ sá»Ÿ dá»¯ liá»‡u rá»“i thá»­ láº¡i."
        ctaHref="/admin/locations"
        ctaLabel="Thá»­ láº¡i"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quáº£n lÃ½ Ä‘iá»ƒm Ä‘áº¿n</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dÃµi má»©c Ä‘á»™ ná»•i báº­t vÃ  sá»‘ tour Ä‘ang gáº¯n vá»›i tá»«ng Ä‘á»‹a Ä‘iá»ƒm.</p>
      </div>

      <form className="iv-card p-4">
        <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          TÃ¬m kiáº¿m Ä‘iá»ƒm Ä‘áº¿n
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="TÃªn, slug hoáº·c tá»‰nh/thÃ nh..."
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            TÃ¬m kiáº¿m
          </button>
        </div>
      </form>

      <AdminCreateLocationForm />

      {data.items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((location) => (
              <article key={location.id} className="iv-card overflow-hidden">
                <div className="relative h-44">
                  <SafeImage src={location.imageUrl} alt={location.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{location.provinceOrCity}</p>
                  <Link href={`/dia-diem/${location.slug}`} className="text-lg font-semibold text-slate-900 hover:text-teal-700">
                    {location.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    {location.featured ? <Badge variant="default">Ná»•i báº­t</Badge> : <Badge variant="outline">ThÆ°á»ng</Badge>}
                    <Badge variant="outline">{location._count.tours} tour</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{location.shortDescription}</p>
                  <p className="text-xs text-slate-500">Cáº­p nháº­t: {formatDate(location.updatedAt)}</p>
                  <Link
                    href={`/admin/locations/${location.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Quáº£n lÃ½ chi tiáº¿t
                  </Link>
                  <AdminLocationActions locationId={location.id} featured={location.featured} />
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} â€¢ Tá»•ng {data.total} Ä‘iá»ƒm Ä‘áº¿n
            </p>
            <div className="flex gap-2">
              <Link
                href={{
                  pathname: "/admin/locations",
                  query: {
                    ...params,
                    page: String(Math.max(data.page - 1, 1)),
                  },
                }}
                className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
              >
                Trang trÆ°á»›c
              </Link>
              <Link
                href={{
                  pathname: "/admin/locations",
                  query: {
                    ...params,
                    page: String(Math.min(data.page + 1, data.totalPages)),
                  },
                }}
                className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
              >
                Trang sau
              </Link>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="KhÃ´ng cÃ³ Ä‘iá»ƒm Ä‘áº¿n phÃ¹ há»£p"
          description="HÃ£y thá»­ tá»« khÃ³a khÃ¡c Ä‘á»ƒ tÃ¬m kiáº¿m."
          ctaHref="/admin/locations"
          ctaLabel="XÃ³a bá»™ lá»c"
        />
      )}
    </div>
  );
}

