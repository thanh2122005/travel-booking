"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils/format";
import { bookingSchema, type BookingInput } from "@/lib/validations/booking";

type TourBookingCardProps = {
  tourId: string;
  tourSlug: string;
  shortDescription: string;
  unitPrice: number;
  originalPrice: number;
  maxGuests: number;
};

export function TourBookingCard({
  tourId,
  tourSlug,
  shortDescription,
  unitPrice,
  originalPrice,
  maxGuests,
}: TourBookingCardProps) {
  const { data: session, status } = useSession();
  const isLoggedIn = Boolean(session?.user);

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
      phone: "",
      numberOfGuests: 1,
      note: "",
      departureDate: "",
    },
  });

  useEffect(() => {
    setValue("tourId", tourId);
  }, [setValue, tourId]);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    setValue("fullName", session.user.name ?? "");
    setValue("email", session.user.email ?? "");
  }, [session, setValue]);

  const numberOfGuests = useWatch({
    control,
    name: "numberOfGuests",
  }) || 1;
  const totalPrice = unitPrice * numberOfGuests;

  const onSubmit = handleSubmit(async (values) => {
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
        <form onSubmit={onSubmit} className="space-y-3 border-t pt-4">
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
    </div>
  );
}
