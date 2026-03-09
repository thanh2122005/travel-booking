"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Heart, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";
import { bookingSchema, type BookingInput } from "@/lib/validations/booking";
import { reviewSchema } from "@/lib/validations/tour-interactions";

type InitialReview = {
  rating: number;
  comment: string;
} | null;

type TourBookingCardProps = {
  tourId: string;
  tourSlug: string;
  shortDescription: string;
  unitPrice: number;
  originalPrice: number;
  maxGuests: number;
  initialIsFavorite: boolean;
  initialReview: InitialReview;
  initialPhone: string;
};

export function TourBookingCard({
  tourId,
  tourSlug,
  shortDescription,
  unitPrice,
  originalPrice,
  maxGuests,
  initialIsFavorite,
  initialReview,
  initialPhone,
}: TourBookingCardProps) {
  const { data: session, status } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isFavoriteSubmitting, setIsFavoriteSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(initialReview?.rating ?? 5);
  const [reviewComment, setReviewComment] = useState(initialReview?.comment ?? "");
  const [hasExistingReview, setHasExistingReview] = useState(Boolean(initialReview));
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const {
    control,
    register,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      tourId,
      fullName: "",
      email: "",
      phone: initialPhone,
      numberOfGuests: 1,
      note: "",
      departureDate: "",
    },
  });

  useEffect(() => {
    setValue("tourId", tourId);
  }, [setValue, tourId]);

  useEffect(() => {
    if (initialPhone) {
      setValue("phone", initialPhone);
    }
  }, [initialPhone, setValue]);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    setValue("fullName", session.user.name ?? "");
    setValue("email", session.user.email ?? "");
  }, [session, setValue]);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  useEffect(() => {
    setReviewRating(initialReview?.rating ?? 5);
    setReviewComment(initialReview?.comment ?? "");
    setHasExistingReview(Boolean(initialReview));
  }, [initialReview]);

  const numberOfGuests = useWatch({
    control,
    name: "numberOfGuests",
  }) || 1;
  const totalPrice = unitPrice * numberOfGuests;

  const onSubmitBooking = handleSubmit(async (values) => {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      toast.error(payload.message ?? "Không thể đặt tour, vui lòng thử lại.");
      return;
    }

    toast.success(payload.message ?? "Đặt tour thành công.");
    reset({
      ...values,
      tourId,
      numberOfGuests: 1,
      note: "",
      departureDate: "",
    });
  });

  async function handleToggleFavorite() {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để lưu tour yêu thích.");
      return;
    }

    setIsFavoriteSubmitting(true);
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tourId,
        }),
      });

      const payload = (await response.json()) as { message?: string; isFavorite?: boolean };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật yêu thích, vui lòng thử lại.");
        return;
      }

      setIsFavorite(payload.isFavorite ?? false);
      toast.success(payload.message ?? "Đã cập nhật danh sách yêu thích.");
    } finally {
      setIsFavoriteSubmitting(false);
    }
  }

  async function handleSubmitReview() {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để đánh giá.");
      return;
    }

    const parsed = reviewSchema.safeParse({
      tourId,
      rating: reviewRating,
      comment: reviewComment,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      toast.error(firstIssue?.message ?? "Dữ liệu đánh giá không hợp lệ.");
      return;
    }

    setIsReviewSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể gửi đánh giá, vui lòng thử lại.");
        return;
      }

      setHasExistingReview(true);
      toast.success(payload.message ?? "Đánh giá của bạn đã được ghi nhận.");
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Tóm tắt đặt tour</h3>
      <p className="text-sm text-muted-foreground">{shortDescription}</p>

      <div>
        <p className="text-xs text-muted-foreground">Giá từ</p>
        <p className="text-2xl font-black text-primary">{formatPrice(unitPrice)}</p>
        {unitPrice !== originalPrice ? (
          <p className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</p>
        ) : null}
      </div>

      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-primary" />
        Có thể chọn ngày khởi hành linh hoạt
      </p>

      {status === "loading" ? (
        <div className="h-10 animate-pulse rounded-xl bg-muted" />
      ) : null}

      {!isLoggedIn && status !== "loading" ? (
        <Link
          href={`/dang-nhap?callbackUrl=/tours/${tourSlug}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Đăng nhập để đặt tour
        </Link>
      ) : null}

      {isLoggedIn ? (
        <form onSubmit={onSubmitBooking} className="space-y-3 border-t pt-4">
          <div className="space-y-1.5">
            <Label htmlFor={`fullName-${tourId}`}>Họ và tên</Label>
            <Input id={`fullName-${tourId}`} placeholder="Nguyễn Văn A" {...register("fullName")} />
            {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`email-${tourId}`}>Email</Label>
            <Input id={`email-${tourId}`} type="email" placeholder="ban@example.com" {...register("email")} />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`phone-${tourId}`}>Số điện thoại</Label>
            <Input id={`phone-${tourId}`} type="tel" placeholder="0909123456" {...register("phone")} />
            {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`guests-${tourId}`}>Số khách</Label>
              <Input
                id={`guests-${tourId}`}
                type="number"
                min={1}
                max={maxGuests}
                {...register("numberOfGuests", { valueAsNumber: true })}
              />
              {errors.numberOfGuests ? (
                <p className="text-xs text-destructive">{errors.numberOfGuests.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`departure-${tourId}`}>Ngày đi</Label>
              <Input id={`departure-${tourId}`} type="date" {...register("departureDate")} />
              {errors.departureDate ? (
                <p className="text-xs text-destructive">{errors.departureDate.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`note-${tourId}`}>Ghi chú</Label>
            <Textarea
              id={`note-${tourId}`}
              placeholder="Ví dụ: cần hỗ trợ suất ăn chay, ghế gần nhau..."
              rows={3}
              {...register("note")}
            />
            {errors.note ? <p className="text-xs text-destructive">{errors.note.message}</p> : null}
          </div>

          <div className="rounded-xl border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Tổng tạm tính: {formatPrice(totalPrice)}</p>
            <p className="text-xs text-muted-foreground">Số khách tối đa cho đơn này: {maxGuests} người.</p>
          </div>

          <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi yêu cầu...
              </>
            ) : (
              "Đặt tour ngay"
            )}
          </Button>
        </form>
      ) : null}

      <div className="space-y-3 border-t pt-4">
        <Button
          type="button"
          variant={isFavorite ? "default" : "outline"}
          className="h-10 w-full"
          onClick={handleToggleFavorite}
          disabled={!isLoggedIn || isFavoriteSubmitting}
        >
          {isFavoriteSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            <>
              <Heart className={cn("mr-2 h-4 w-4", isFavorite ? "fill-current" : "")} />
              {isFavorite ? "Đã lưu yêu thích" : "Thêm vào yêu thích"}
            </>
          )}
        </Button>
        {!isLoggedIn ? (
          <p className="text-xs text-muted-foreground">Đăng nhập để lưu tour vào danh sách yêu thích của bạn.</p>
        ) : null}
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Đánh giá của bạn</p>
          <p className="text-xs text-muted-foreground">
            Chỉ người dùng có đơn đã xác nhận hoặc đã hoàn thành mới có thể gửi đánh giá.
          </p>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setReviewRating(value)}
                className="rounded-md p-1 transition-colors hover:bg-muted disabled:cursor-not-allowed"
                disabled={!isLoggedIn || isReviewSubmitting}
                aria-label={`Chọn ${value} sao`}
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    value <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                  )}
                />
              </button>
            );
          })}
          <span className="ml-1 text-xs text-muted-foreground">{reviewRating}/5</span>
        </div>

        <Textarea
          rows={4}
          placeholder="Chia sẻ trải nghiệm thực tế của bạn về tour này..."
          value={reviewComment}
          onChange={(event) => setReviewComment(event.target.value)}
          disabled={!isLoggedIn || isReviewSubmitting}
        />

        <Button
          type="button"
          variant="secondary"
          className="h-10 w-full"
          onClick={handleSubmitReview}
          disabled={!isLoggedIn || isReviewSubmitting}
        >
          {isReviewSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang gửi đánh giá...
            </>
          ) : hasExistingReview ? (
            "Cập nhật đánh giá"
          ) : (
            "Gửi đánh giá"
          )}
        </Button>

        {!isLoggedIn ? (
          <p className="text-xs text-muted-foreground">Đăng nhập để gửi đánh giá cho tour này.</p>
        ) : null}
      </div>
    </div>
  );
}
