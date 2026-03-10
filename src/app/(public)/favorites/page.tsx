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
          Tour yêu thích
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Danh sách tour yêu thích</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          Tour được lưu từ trang chi tiết sẽ xuất hiện tại đây. Dữ liệu map trực tiếp từ model Favorite trong Prisma.
        </p>
      </div>

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="Đã lưu"
          title="Tour bạn đang theo dõi"
          description="Danh sách này được đồng bộ theo tài khoản người dùng và cập nhật theo thao tác yêu thích."
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
            title="Chưa có tour yêu thích"
            description="Bạn có thể nhấn nút yêu thích trong trang tour detail để lưu nhanh."
            ctaHref="/tours"
            ctaLabel="Khám phá tour"
          />
        ) : (
          <EmptyState
            title="Đăng nhập để xem tour yêu thích"
            description="Danh sách yêu thích gắn với tài khoản, vui lòng đăng nhập để tiếp tục."
            ctaHref="/dang-nhap?callbackUrl=/favorites"
            ctaLabel="Đăng nhập"
          />
        )}
      </section>
    </div>
  );
}
