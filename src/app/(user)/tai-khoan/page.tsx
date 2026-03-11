import Link from "next/link";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import {
  CalendarClock,
  CircleDollarSign,
  Heart,
  MessageSquareText,
  Phone,
  TicketCheck,
  UserCircle2,
} from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SafeImage } from "@/components/common/safe-image";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/db/user-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type FavoriteSortValue = "newest" | "price-asc" | "price-desc";
type ReviewSortValue = "newest" | "rating-desc" | "rating-asc";

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

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseBookingStatus(value: string): BookingStatus | "" {
  if (value === "PENDING" || value === "CONFIRMED" || value === "CANCELLED" || value === "COMPLETED") {
    return value;
  }
  return "";
}

function parsePaymentStatus(value: string): PaymentStatus | "" {
  if (value === "UNPAID" || value === "PAID") {
    return value;
  }
  return "";
}

function parseFavoriteSort(value: string): FavoriteSortValue {
  if (value === "price-asc" || value === "price-desc") {
    return value;
  }
  return "newest";
}

function parseReviewSort(value: string): ReviewSortValue {
  if (value === "rating-desc" || value === "rating-asc") {
    return value;
  }
  return "newest";
}

function parseMinRating(value: string) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  const normalized = Math.trunc(rating);
  return normalized >= 1 && normalized <= 5 ? normalized : 0;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const bookingSearch = normalizeParam(params.bookingSearch);
  const bookingStatus = parseBookingStatus(normalizeParam(params.bookingStatus));
  const paymentStatus = parsePaymentStatus(normalizeParam(params.paymentStatus));
  const favoriteSearch = normalizeParam(params.favoriteSearch);
  const favoriteSort = parseFavoriteSort(normalizeParam(params.favoriteSort));
  const reviewSearch = normalizeParam(params.reviewSearch);
  const reviewSort = parseReviewSort(normalizeParam(params.reviewSort));
  const reviewMinRating = parseMinRating(normalizeParam(params.reviewMinRating));

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

  const normalizedBookingSearch = bookingSearch.trim().toLowerCase();
  const normalizedFavoriteSearch = favoriteSearch.trim().toLowerCase();
  const normalizedReviewSearch = reviewSearch.trim().toLowerCase();

  const filteredBookings = data.bookings.filter((booking) => {
    const searchMatched =
      !normalizedBookingSearch ||
      booking.bookingCode.toLowerCase().includes(normalizedBookingSearch) ||
      booking.tour.title.toLowerCase().includes(normalizedBookingSearch) ||
      booking.tour.departureLocation.toLowerCase().includes(normalizedBookingSearch);
    const statusMatched = !bookingStatus || booking.status === bookingStatus;
    const paymentMatched = !paymentStatus || booking.paymentStatus === paymentStatus;
    return searchMatched && statusMatched && paymentMatched;
  });

  const filteredFavorites = data.favorites
    .filter((favorite) => {
      if (!normalizedFavoriteSearch) return true;
      return (
        favorite.tour.title.toLowerCase().includes(normalizedFavoriteSearch) ||
        favorite.tour.shortDescription.toLowerCase().includes(normalizedFavoriteSearch) ||
        favorite.tour.location.name.toLowerCase().includes(normalizedFavoriteSearch)
      );
    })
    .slice()
    .sort((a, b) => {
      const priceA = a.tour.discountPrice ?? a.tour.price;
      const priceB = b.tour.discountPrice ?? b.tour.price;

      if (favoriteSort === "price-asc") return priceA - priceB;
      if (favoriteSort === "price-desc") return priceB - priceA;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });

  const filteredReviews = data.reviews
    .filter((review) => {
      const searchMatched =
        !normalizedReviewSearch ||
        review.comment.toLowerCase().includes(normalizedReviewSearch) ||
        review.tour.title.toLowerCase().includes(normalizedReviewSearch);
      const ratingMatched = !reviewMinRating || review.rating >= reviewMinRating;
      return searchMatched && ratingMatched;
    })
    .slice()
    .sort((a, b) => {
      if (reviewSort === "rating-desc") return b.rating - a.rating;
      if (reviewSort === "rating-asc") return a.rating - b.rating;
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });

  const confirmedRevenue = data.bookings
    .filter((booking) => booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED)
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
  const pendingBookings = data.bookings.filter((booking) => booking.status === BookingStatus.PENDING).length;
  const paidBookings = data.bookings.filter((booking) => booking.paymentStatus === PaymentStatus.PAID).length;

  return (
    <div className="space-y-8">
      <section className="iv-card overflow-hidden bg-[linear-gradient(130deg,#091f33,#0a314d,#085a66)] p-6 text-white md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">
          <UserCircle2 className="h-4 w-4" />
          Tài khoản của bạn
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Xin chào, {data.fullName}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">
          Theo dõi đơn đặt tour, danh sách yêu thích và lịch sử đánh giá tại một nơi.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/booking" className="iv-btn-soft inline-flex h-9 items-center px-4 text-sm font-semibold">
            Quản lý booking
          </Link>
          <Link href="/favorites" className="iv-btn-soft inline-flex h-9 items-center px-4 text-sm font-semibold">
            Tour yêu thích
          </Link>
          <Link href="/reviews" className="iv-btn-soft inline-flex h-9 items-center px-4 text-sm font-semibold">
            Xem đánh giá
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="iv-card p-4">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <TicketCheck className="h-3.5 w-3.5" />
            Đơn đặt tour
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{data._count.bookings}</p>
          <p className="mt-1 text-xs text-slate-500">{pendingBookings} đơn đang chờ xác nhận</p>
        </article>
        <article className="iv-card p-4">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <CircleDollarSign className="h-3.5 w-3.5" />
            Chi tiêu đã xác nhận
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatPrice(confirmedRevenue)}</p>
          <p className="mt-1 text-xs text-slate-500">{paidBookings} đơn đã thanh toán</p>
        </article>
        <article className="iv-card p-4">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Heart className="h-3.5 w-3.5" />
            Tour yêu thích
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{data._count.favorites}</p>
          <p className="mt-1 text-xs text-slate-500">Lưu từ trang chi tiết tour</p>
        </article>
        <article className="iv-card p-4">
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock className="h-3.5 w-3.5" />
            Thông tin liên hệ
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{data.email}</p>
          <p className="mt-1 text-xs text-slate-500 inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            {data.phone || "Chưa cập nhật"}
          </p>
        </article>
      </section>

      <section className="iv-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Lịch sử đặt tour</h2>
          <Badge variant="outline">
            {filteredBookings.length}/{data.bookings.length} đơn
          </Badge>
        </div>

        <form className="mb-4 grid gap-2 md:grid-cols-[1fr_180px_180px_auto]">
          <input
            name="bookingSearch"
            defaultValue={bookingSearch}
            placeholder="Mã đơn, tên tour hoặc điểm khởi hành..."
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            name="bookingStatus"
            defaultValue={bookingStatus}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả trạng thái đơn</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <select
            name="paymentStatus"
            defaultValue={paymentStatus}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
          </select>
          <button
            type="submit"
            className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
          >
            Lọc booking
          </button>
        </form>

        {filteredBookings.length ? (
          <div className="space-y-3">
            <div className="space-y-3 lg:hidden">
              {filteredBookings.slice(0, 10).map((booking) => (
                <article key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{booking.bookingCode}</p>
                      <p className="text-xs text-slate-500">{formatDate(booking.createdAt)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatPrice(booking.totalPrice)}</p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">{booking.tour.title}</p>
                  <p className="text-xs text-slate-500">Khởi hành từ: {booking.tour.departureLocation}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={bookingStatusMap[booking.status].variant}>
                      {bookingStatusMap[booking.status].label}
                    </Badge>
                    <Badge variant={paymentStatusMap[booking.paymentStatus].variant}>
                      {paymentStatusMap[booking.paymentStatus].label}
                    </Badge>
                    <span className="text-xs text-slate-500">{booking.numberOfGuests} khách</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-sm">
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
                  {filteredBookings.slice(0, 15).map((booking) => (
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
          </div>
        ) : data.bookings.length ? (
          <EmptyState
            title="Không có booking phù hợp"
            description="Hãy thử thay đổi bộ lọc để xem thêm đơn đặt tour."
            ctaHref="/tai-khoan"
            ctaLabel="Xóa lọc booking"
          />
        ) : (
          <EmptyState
            title="Bạn chưa có đơn đặt tour"
            description="Hãy chọn một tour phù hợp và bắt đầu hành trình đầu tiên của bạn."
            ctaHref="/tours"
            ctaLabel="Khám phá tour"
          />
        )}
      </section>

      <section className="iv-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
            <Heart className="h-5 w-5 text-primary" />
            Tour yêu thích
          </h2>
          <Badge variant="outline">
            {filteredFavorites.length}/{data.favorites.length} tour
          </Badge>
        </div>

        <form className="mb-4 grid gap-2 md:grid-cols-[1fr_200px_auto]">
          <input
            name="favoriteSearch"
            defaultValue={favoriteSearch}
            placeholder="Tên tour, điểm đến hoặc mô tả..."
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            name="favoriteSort"
            defaultValue={favoriteSort}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="newest">Mới lưu gần đây</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
          </select>
          <button
            type="submit"
            className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
          >
            Lọc yêu thích
          </button>
        </form>

        {filteredFavorites.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFavorites.slice(0, 9).map((item) => {
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
        ) : data.favorites.length ? (
          <EmptyState
            title="Không có tour phù hợp bộ lọc"
            description="Hãy thử từ khóa khác để xem thêm tour yêu thích."
            ctaHref="/tai-khoan"
            ctaLabel="Xóa lọc yêu thích"
          />
        ) : (
          <EmptyState
            title="Danh sách yêu thích đang trống"
            description="Bạn có thể nhấn nút yêu thích trong trang chi tiết tour để lưu lại."
            ctaHref="/tours"
            ctaLabel="Xem tour ngay"
          />
        )}
      </section>

      <section className="iv-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
            <MessageSquareText className="h-5 w-5 text-primary" />
            Đánh giá của bạn
          </h2>
          <Badge variant="outline">
            {filteredReviews.length}/{data.reviews.length} đánh giá
          </Badge>
        </div>

        <form className="mb-4 grid gap-2 md:grid-cols-[1fr_160px_180px_auto]">
          <input
            name="reviewSearch"
            defaultValue={reviewSearch}
            placeholder="Tên tour hoặc nội dung đánh giá..."
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            name="reviewMinRating"
            defaultValue={reviewMinRating || ""}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả mức điểm</option>
            <option value="5">Từ 5 sao</option>
            <option value="4">Từ 4 sao</option>
            <option value="3">Từ 3 sao</option>
            <option value="2">Từ 2 sao</option>
            <option value="1">Từ 1 sao</option>
          </select>
          <select
            name="reviewSort"
            defaultValue={reviewSort}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="newest">Mới cập nhật</option>
            <option value="rating-desc">Điểm cao đến thấp</option>
            <option value="rating-asc">Điểm thấp đến cao</option>
          </select>
          <button
            type="submit"
            className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
          >
            Lọc đánh giá
          </button>
        </form>

        {filteredReviews.length ? (
          <div className="space-y-3">
            {filteredReviews.slice(0, 12).map((review) => (
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
        ) : data.reviews.length ? (
          <EmptyState
            title="Không có đánh giá phù hợp"
            description="Hãy thử điều chỉnh bộ lọc để xem các đánh giá khác."
            ctaHref="/tai-khoan"
            ctaLabel="Xóa lọc đánh giá"
          />
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
