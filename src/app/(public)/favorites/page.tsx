import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { getAuthSession } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/db/user-queries";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await getAuthSession();
  const dashboard = session?.user?.id ? await getUserDashboardData(session.user.id).catch(() => null) : null;
  const favorites = dashboard?.favorites ?? [];

  return (
    <div className="space-y-8">
      <div className="iv-card overflow-hidden bg-[linear-gradient(130deg,#091f33,#0a314d,#085a66)] p-7 text-white md:p-9">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
          <Heart className="h-4 w-4" />
          Favorite Tours
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Danh sach tour yeu thich</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          Tour duoc luu tu trang chi tiet se xuat hien tai day. Du lieu map truc tiep tu model Favorite trong Prisma.
        </p>
      </div>

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Saved Tours"
          title="Tour ban dang theo doi"
          description="Danh sach nay duoc dong bo theo tai khoan nguoi dung va cap nhat theo thao tac yeu thich."
        />

        {favorites.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => {
              const displayPrice = favorite.tour.discountPrice ?? favorite.tour.price;

              return (
                <article key={favorite.id} className="iv-card overflow-hidden">
                  <Link href={`/tours/${favorite.tour.slug}`} className="group block">
                    <div className="relative h-52">
                      <Image
                        src={favorite.tour.featuredImage}
                        alt={favorite.tour.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="space-y-2 p-5">
                      <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{favorite.tour.title}</h3>
                      <p className="line-clamp-2 text-sm leading-7 text-slate-600">{favorite.tour.shortDescription}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{favorite.tour.location.name}</p>
                      <p className="text-lg font-bold text-teal-700">{formatPrice(displayPrice)}</p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : session?.user ? (
          <EmptyState
            title="Chua co tour yeu thich"
            description="Ban co the nhan nut yeu thich trong trang tour detail de luu nhanh."
            ctaHref="/tours"
            ctaLabel="Kham pha tours"
          />
        ) : (
          <EmptyState
            title="Dang nhap de xem favorites"
            description="Danh sach yeu thich gan voi tai khoan, vui long dang nhap de tiep tuc."
            ctaHref="/dang-nhap?callbackUrl=/favorites"
            ctaLabel="Dang nhap"
          />
        )}
      </section>
    </div>
  );
}
