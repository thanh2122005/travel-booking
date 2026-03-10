import Link from "next/link";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { CalendarClock, Heart, MessageSquareText, Phone, TicketCheck, UserCircle2 } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SafeImage } from "@/components/common/safe-image";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/db/user-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const bookingStatusMap: Record<BookingStatus, { label: string; variant: "secondary" | "default" | "destructive" }> =
  {
    PENDING: {
      label: "Chờ xác nhận",
      variant: "secondary",
    },
    CONFIRMED: {
      label: "Đã xác nhận",
      variant: "default",
    },
    CANCELLED: {
      label: "Đã hủy",
      variant: "destructive",
    },
    COMPLETED: {
      label: "Hoàn thành",
      variant: "default",
    },
  };

const paymentStatusMap: Record<PaymentStatus, { label: string; variant: "secondary" | "default" }> = {
  UNPAID: {
    label: "Chưa thanh toán",
    variant: "secondary",
  },
  PAID: {
    label: "Đã thanh toán",
    variant: "default",
  },
};

export default async function AccountPage() {
  const session = await requireUser();
  const data = await getUserDashboardData(session.user.id);

  if (!data) {
    return (
      <section className="py-8">
        <EmptyState
          title="Không tìm thấy tài khoản"
          description="Không thể tải thông tin tài khoản của bạn ở thời điểm hiện tại."
          ctaHref="/"
          ctaLabel="Về trang chủ"
        />
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
          <UserCircle2 className="h-4 w-4" />
          Khu vực người dùng
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Xin chào, {data.fullName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Quản lý thông tin cá nhân, theo dõi đơn đặt tour, xem danh sách yêu thích và lịch sử đánh giá tại một
          nơi.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1 text-sm font-semibold">{data.email}</p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              Số điện thoại
            </p>
            <p className="mt-1 text-sm font-semibold">{data.phone || "Chưa cập nhật"}</p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <TicketCheck className="h-3.5 w-3.5" />
              Đơn đặt tour
            </p>
            <p className="mt-1 text-2xl font-black text-primary">{data._count.bookings}</p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Thành viên từ
            </p>
            <p className="mt-1 text-sm font-semibold">{formatDate(data.createdAt)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Lịch sử đặt tour</h2>
          <Badge variant="outline">{data.bookings.length} đơn gần nhất</Badge>
        </div>

        {data.bookings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-2 py-3 font-medium">Mã đơn</th>
                  <th className="px-2 py-3 font-medium">Tour</th>
                  <th className="px-2 py-3 font-medium">Số khách</th>
                  <th className="px-2 py-3 font-medium">Tổng tiền</th>
                  <th className="px-2 py-3 font-medium">Trạng thái</th>
                  <th className="px-2 py-3 font-medium">Thanh toán</th>
                  <th className="px-2 py-3 font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((booking) => (
                  <tr key={booking.id} className="border-b last:border-0">
                    <td className="px-2 py-3 font-medium">{booking.bookingCode}</td>
                    <td className="px-2 py-3">
                      <Link href={`/tours/${booking.tour.slug}`} className="font-medium hover:text-primary">
                        {booking.tour.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">Khởi hành từ: {booking.tour.departureLocation}</p>
                    </td>
                    <td className="px-2 py-3">{booking.numberOfGuests}</td>
                    <td className="px-2 py-3 font-medium">{formatPrice(booking.totalPrice)}</td>
                    <td className="px-2 py-3">
                      <Badge variant={bookingStatusMap[booking.status].variant}>
                        {bookingStatusMap[booking.status].label}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={paymentStatusMap[booking.paymentStatus].variant}>
                        {paymentStatusMap[booking.paymentStatus].label}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{formatDate(booking.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Bạn chưa có đơn đặt tour"
            description="Hãy chọn một tour phù hợp và bắt đầu hành trình đầu tiên của bạn."
            ctaHref="/tours"
            ctaLabel="Khám phá tour"
          />
        )}
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold">
            <Heart className="h-5 w-5 text-primary" />
            Tour yêu thích
          </h2>
          <Badge variant="outline">{data._count.favorites} tour</Badge>
        </div>

        {data.favorites.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.favorites.map((item) => {
              const displayPrice = item.tour.discountPrice ?? item.tour.price;

              return (
                <article key={item.id} className="overflow-hidden rounded-2xl border bg-background">
                  <Link href={`/tours/${item.tour.slug}`} className="relative block h-40">
                    <SafeImage
                      src={item.tour.featuredImage}
                      alt={item.tour.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </Link>
                  <div className="space-y-2 p-4">
                    <Link href={`/tours/${item.tour.slug}`} className="line-clamp-2 text-base font-semibold hover:text-primary">
                      {item.tour.title}
                    </Link>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{item.tour.shortDescription}</p>
                    <p className="text-xs text-muted-foreground">Địa điểm: {item.tour.location.name}</p>
                    <p className="font-bold text-primary">{formatPrice(displayPrice)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Danh sách yêu thích đang trống"
            description="Bạn có thể nhấn nút yêu thích trong trang chi tiết tour để lưu lại."
            ctaHref="/tours"
            ctaLabel="Xem tour ngay"
          />
        )}
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold">
            <MessageSquareText className="h-5 w-5 text-primary" />
            Đánh giá của bạn
          </h2>
          <Badge variant="outline">{data._count.reviews} đánh giá</Badge>
        </div>

        {data.reviews.length ? (
          <div className="space-y-3">
            {data.reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/tours/${review.tour.slug}`} className="font-semibold hover:text-primary">
                    {review.tour.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">Cập nhật: {formatDate(review.updatedAt)}</p>
                </div>
                <p className="mt-2 text-sm font-medium">Đánh giá: {review.rating}/5</p>
                <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Bạn chưa có đánh giá nào"
            description="Sau khi tham gia tour, hãy để lại nhận xét để giúp cộng đồng lựa chọn dễ hơn."
            ctaHref="/tours"
            ctaLabel="Tìm tour để trải nghiệm"
          />
        )}
      </section>
    </div>
  );
}
