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
    title: "1. Chọn tour và ngày khởi hành",
    description: "Tìm tour phù hợp, xem itinerary, giá, số khách tối đa và bổ sung ghi chú.",
  },
  {
    icon: UserRoundCheck,
    title: "2. Xác nhận thông tin",
    description: "Nhập thông tin liên hệ, số khách và gửi yêu cầu đặt tour qua form booking.",
  },
  {
    icon: FileCheck2,
    title: "3. Đợi xác nhận",
    description: "Đơn booking sẽ được duyệt và cập nhật trạng thái theo real data trong tài khoản.",
  },
  {
    icon: CreditCard,
    title: "4. Thanh toán",
    description: "Theo dõi trạng thái thanh toán và thông tin đơn trong dashboard người dùng.",
  },
];

export default async function BookingPage() {
  const session = await getAuthSession();
  const dashboard = session?.user?.id ? await getUserDashboardData(session.user.id).catch(() => null) : null;

  return (
    <div className="space-y-10">
      <PageHeroBanner
        eyebrow="Booking Flow"
        title="Đặt tour rõ ràng và dễ theo dõi"
        description="Trang booking tổng hợp luồng đặt tour, giúp người dùng hiểu rõ các bước từ chọn tour đến xác nhận đơn."
        imageSrc="/immerse-vietnam/images/header-bg.jpg"
      />

      <section className="space-y-5">
        <HomeSectionHeading
          eyebrow="How It Works"
          title="Quy trình đặt tour 4 bước"
          description="Refactor từ template showcase thành flow booking có context dữ liệu và điều hướng rõ ràng."
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
            title="Đơn đặt tour gần đây của bạn"
            description="Bảng này map dữ liệu trực tiếp từ model Booking trong Prisma."
          />
          <Link href="/tours" className="iv-btn-soft inline-flex h-10 items-center px-4 text-sm font-semibold">
            Tìm và đặt tour mới
          </Link>
        </div>

        {dashboard?.bookings?.length ? (
          <div className="iv-card overflow-x-auto p-4">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-3 font-medium">Mã đơn</th>
                  <th className="px-2 py-3 font-medium">Tour</th>
                  <th className="px-2 py-3 font-medium">Khách</th>
                  <th className="px-2 py-3 font-medium">Tổng tiền</th>
                  <th className="px-2 py-3 font-medium">Trạng thái</th>
                  <th className="px-2 py-3 font-medium">Ngày tạo</th>
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
                      <p className="text-xs text-slate-500">Khởi hành từ: {booking.tour.departureLocation}</p>
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
            title="Bạn chưa có đơn đặt tour"
            description="Hãy chọn một tour phù hợp và bắt đầu hành trình đầu tiên."
            ctaHref="/tours"
            ctaLabel="Xem danh sách tour"
          />
        ) : (
          <EmptyState
            title="Đăng nhập để theo dõi booking"
            description="Bạn cần đăng nhập để xem lịch sử đặt tour và quản lý các đơn booking."
            ctaHref="/dang-nhap?callbackUrl=/booking"
            ctaLabel="Đăng nhập ngay"
          />
        )}
      </section>
    </div>
  );
}
