import Link from "next/link";
import { CalendarCheck2, CreditCard, FileCheck2, UserRoundCheck } from "lucide-react";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { EmptyState } from "@/components/common/empty-state";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import { Badge } from "@/components/ui/badge";
import { getAuthSession } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/db/user-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const bookingSteps = [
  {
    icon: CalendarCheck2,
    title: "1. Chon tour va ngay khoi hanh",
    description: "Tim tour phu hop, xem itinerary, gia, so khach toi da va bo sung ghi chu.",
  },
  {
    icon: UserRoundCheck,
    title: "2. Xac nhan thong tin",
    description: "Nhap thong tin lien he, so khach va gui yeu cau dat tour qua form booking.",
  },
  {
    icon: FileCheck2,
    title: "3. Doi xac nhan",
    description: "Don booking se duoc duyet va cap nhat trang thai theo real data trong tai khoan.",
  },
  {
    icon: CreditCard,
    title: "4. Thanh toan",
    description: "Theo doi trang thai thanh toan va thong tin don trong dashboard nguoi dung.",
  },
];

export default async function BookingPage() {
  const session = await getAuthSession();
  const dashboard = session?.user?.id ? await getUserDashboardData(session.user.id).catch(() => null) : null;

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Booking Flow"
        title="Dat tour ro rang va de theo doi"
        description="Trang booking tong hop luong dat tour, giup nguoi dung hieu ro cac buoc tu chon tour den xac nhan don."
        imageSrc="/immerse-vietnam/images/header-bg.jpg"
      />

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="How It Works"
          title="Quy trinh dat tour 4 buoc"
          description="Refactor tu template showcase thanh flow booking co context du lieu va dieu huong ro rang."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {bookingSteps.map((step) => (
            <article key={step.title} className="iv-card p-5">
              <step.icon className="h-7 w-7 text-teal-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HomeSectionHeading
            eyebrow="Recent Bookings"
            title="Don dat tour gan day cua ban"
            description="Bang nay map du lieu truc tiep tu model Booking trong Prisma."
          />
          <Link href="/tours" className="iv-btn-soft inline-flex h-10 items-center px-4 text-sm font-semibold">
            Tim va dat tour moi
          </Link>
        </div>

        {dashboard?.bookings?.length ? (
          <div className="iv-card overflow-x-auto p-4">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-3 font-medium">Ma don</th>
                  <th className="px-2 py-3 font-medium">Tour</th>
                  <th className="px-2 py-3 font-medium">Khach</th>
                  <th className="px-2 py-3 font-medium">Tong tien</th>
                  <th className="px-2 py-3 font-medium">Trang thai</th>
                  <th className="px-2 py-3 font-medium">Ngay tao</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.bookings.slice(0, 8).map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-3 font-semibold text-slate-800">{booking.bookingCode}</td>
                    <td className="px-2 py-3">
                      <Link href={`/tours/${booking.tour.slug}`} className="font-medium text-slate-800 hover:text-teal-700">
                        {booking.tour.title}
                      </Link>
                      <p className="text-xs text-slate-500">Khoi hanh tu: {booking.tour.departureLocation}</p>
                    </td>
                    <td className="px-2 py-3">{booking.numberOfGuests}</td>
                    <td className="px-2 py-3 font-medium">{formatPrice(booking.totalPrice)}</td>
                    <td className="px-2 py-3">
                      <Badge variant="outline">{booking.status}</Badge>
                    </td>
                    <td className="px-2 py-3 text-slate-500">{formatDate(booking.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : session?.user ? (
          <EmptyState
            title="Ban chua co don dat tour"
            description="Hay chon mot tour phu hop va bat dau hanh trinh dau tien."
            ctaHref="/tours"
            ctaLabel="Xem danh sach tours"
          />
        ) : (
          <EmptyState
            title="Dang nhap de theo doi booking"
            description="Ban can dang nhap de xem lich su dat tour va quan ly cac don booking."
            ctaHref="/dang-nhap?callbackUrl=/booking"
            ctaLabel="Dang nhap ngay"
          />
        )}
      </section>
    </div>
  );
}
