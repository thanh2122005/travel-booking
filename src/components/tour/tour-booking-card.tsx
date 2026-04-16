"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildCallbackUrl } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";
import { bookingSchema, type BookingInput } from "@/lib/validations/booking";

const CHILD_5_TO_7_PRICE_RATIO = 0.5;
const CHILD_UNDER_5_PRICE_RATIO = 0;
const bookingPolicies = [
  "Hủy tour trực tuyến: chỉ hỗ trợ trước ngày khởi hành tối thiểu 2 ngày.",
  "Đổi lịch khởi hành: gửi yêu cầu trước tối thiểu 3 ngày để được kiểm tra chỗ trống.",
  "Hoàn tiền: xử lý theo chính sách tại thời điểm xác nhận đơn và phương thức thanh toán.",
  "Điều kiện trẻ em: từ 8 tuổi tính 100%, 5-7 tuổi tính 50%, dưới 5 tuổi miễn phí.",
  "Phụ thu lễ/tết, phòng đơn hoặc dịch vụ nâng hạng sẽ được thông báo trước khi chốt đơn.",
] as const;

type TourBookingCardProps = {
  tourId: string;
  tourSlug: string;
  shortDescription: string;
  unitPrice: number;
  originalPrice: number;
  maxGuests: number;
  initialIsFavorite: boolean;
  initialPhone: string;
};

type TourAvailability = {
  tourId: string;
  departureDate: string;
  maxGuests: number;
  bookedGuests: number;
  remainingSeats: number;
  isFull: boolean;
};

const BOOKING_STEPS = [
  { key: 1, title: "Liên hệ" },
  { key: 2, title: "Lịch trình" },
  { key: 3, title: "Xác nhận" },
] as const;

type BookingStep = (typeof BOOKING_STEPS)[number]["key"];

const STEP_FIELDS: Record<BookingStep, (keyof BookingInput)[]> = {
  1: ["fullName", "email", "phone"],
  2: ["guestsFrom8", "child5To7Guests", "childUnder5Guests", "numberOfGuests", "departureDate", "note"],
  3: [],
};

function normalizeGuestCount(value: unknown, fallback: number, min = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(Math.trunc(numeric), min);
}

function isIsoDateInput(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function TourBookingCard({
  tourId,
  tourSlug,
  shortDescription,
  unitPrice,
  originalPrice,
  maxGuests,
  initialIsFavorite,
  initialPhone,
}: TourBookingCardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLoggedIn = Boolean(session?.user);
  const callbackUrl = buildCallbackUrl(
    pathname || `/tours/${tourSlug}`,
    searchParams.toString() ? `?${searchParams.toString()}` : "",
  );
  const loginHref = `/dang-nhap?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const [activeStep, setActiveStep] = useState<BookingStep>(1);
  const [lastBookingCode, setLastBookingCode] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isFavoriteSubmitting, setIsFavoriteSubmitting] = useState(false);
  const [availability, setAvailability] = useState<TourAvailability | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isConfirmChecked, setIsConfirmChecked] = useState(false);
  const reportedCapacityShortageKeysRef = useRef<Set<string>>(new Set());

  const {
    control,
    register,
    setValue,
    getValues,
    reset,
    trigger,
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
      guestsFrom8: 1,
      child5To7Guests: 0,
      childUnder5Guests: 0,
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
    if (!session?.user) return;
    setValue("fullName", session.user.name ?? "");
    setValue("email", session.user.email ?? "");
  }, [session, setValue]);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  useEffect(() => {
    setActiveStep(1);
    setIsConfirmChecked(false);
  }, [tourId]);

  const guestsFrom8Raw = useWatch({
    control,
    name: "guestsFrom8",
  });
  const child5To7GuestsRaw = useWatch({
    control,
    name: "child5To7Guests",
  });
  const childUnder5GuestsRaw = useWatch({
    control,
    name: "childUnder5Guests",
  });
  const numberOfGuests = useWatch({
    control,
    name: "numberOfGuests",
  }) || 1;
  const guestsFrom8 = normalizeGuestCount(guestsFrom8Raw, 1, 1);
  const child5To7Guests = normalizeGuestCount(child5To7GuestsRaw, 0, 0);
  const childUnder5Guests = normalizeGuestCount(childUnder5GuestsRaw, 0, 0);
  const computedTotalGuests = guestsFrom8 + child5To7Guests + childUnder5Guests;
  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());
  const minDepartureDate = minDate.toISOString().slice(0, 10);
  const departureDate = useWatch({
    control,
    name: "departureDate",
  });

  useEffect(() => {
    if (!departureDate) {
      setAvailability(null);
      setAvailabilityError(null);
      return;
    }
    if (!isIsoDateInput(departureDate)) {
      setAvailability(null);
      setAvailabilityError("Ngày đi không hợp lệ.");
      return;
    }

    const controller = new AbortController();
    setIsLoadingAvailability(true);
    setAvailabilityError(null);

    fetch(
      `/api/tours/${encodeURIComponent(tourId)}/availability?departureDate=${encodeURIComponent(
        departureDate,
      )}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as
          | TourAvailability
          | { message?: string };
        if (!response.ok) {
          setAvailability(null);
          setAvailabilityError(
            "message" in payload
              ? payload.message ?? "Không lấy được dữ liệu chỗ trống."
              : "Không lấy được dữ liệu chỗ trống.",
          );
          return;
        }
        setAvailability(payload as TourAvailability);
      })
      .catch((error: unknown) => {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          error.name === "AbortError"
        ) {
          return;
        }
        setAvailability(null);
        setAvailabilityError("Không lấy được dữ liệu chỗ trống.");
      })
      .finally(() => {
        setIsLoadingAvailability(false);
      });

    return () => {
      controller.abort();
    };
  }, [departureDate, tourId]);

  useEffect(() => {
    if (numberOfGuests !== computedTotalGuests) {
      setValue("numberOfGuests", computedTotalGuests, { shouldValidate: true });
    }
  }, [computedTotalGuests, numberOfGuests, setValue]);

  const totalPrice = Math.round(
    unitPrice *
      (guestsFrom8 + child5To7Guests * CHILD_5_TO_7_PRICE_RATIO + childUnder5Guests * CHILD_UNDER_5_PRICE_RATIO),
  );
  const adultUnitPrice = unitPrice;
  const child5To7UnitPrice = Math.round(unitPrice * CHILD_5_TO_7_PRICE_RATIO);
  const childUnder5UnitPrice = Math.round(unitPrice * CHILD_UNDER_5_PRICE_RATIO);
  const adultsTotalPrice = guestsFrom8 * adultUnitPrice;
  const child5To7TotalPrice = child5To7Guests * child5To7UnitPrice;
  const childUnder5TotalPrice = childUnder5Guests * childUnder5UnitPrice;
  const bookingSummary = {
    fullName: getValues("fullName"),
    email: getValues("email"),
    phone: getValues("phone"),
    departureDate: getValues("departureDate"),
    note: getValues("note"),
  };

  async function goToNextStep() {
    const fields = STEP_FIELDS[activeStep];
    const valid = fields.length ? await trigger(fields) : true;
    if (!valid) return;

    if (activeStep === 2 && computedTotalGuests > maxGuests) {
      toast.error(`Tour này chỉ nhận tối đa ${maxGuests} khách cho một đơn.`);
      return;
    }
    if (activeStep === 2 && availability && computedTotalGuests > availability.remainingSeats) {
      const reportedInquiryCode = await reportCapacityShortage({
        requestedGuests: computedTotalGuests,
        remainingSeats: availability.remainingSeats,
      });
      const shortageText =
        availability.remainingSeats > 0
          ? `Ngày đã chọn chỉ còn ${availability.remainingSeats} chỗ trống.`
          : "Ngày đã chọn đã hết chỗ.";
      const inquiryText = reportedInquiryCode
        ? `Chúng tôi đã ghi nhận yêu cầu (${reportedInquiryCode}) và sẽ liên hệ bạn sớm để tư vấn phương án phù hợp.`
        : "Chúng tôi đã ghi nhận yêu cầu và sẽ liên hệ bạn sớm để tư vấn phương án phù hợp.";
      
      toast.error(shortageText, { description: inquiryText });
      return;
    }

    setActiveStep((prev) => {
      const nextStep = prev < 3 ? ((prev + 1) as BookingStep) : prev;
      if (nextStep === 3) {
        setIsConfirmChecked(false);
      }
      return nextStep;
    });
  }

  function goToPreviousStep() {
    setActiveStep((prev) => {
      const nextStep = prev > 1 ? ((prev - 1) as BookingStep) : prev;
      if (nextStep !== 3) {
        setIsConfirmChecked(false);
      }
      return nextStep;
    });
  }

  const onSubmitBooking = handleSubmit(async (values) => {
    if (activeStep !== 3 || !isConfirmChecked) {
      toast.error("Vui lòng kiểm tra thông tin và tick xác nhận trước khi đặt tour.");
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          numberOfGuests: computedTotalGuests,
          guestsFrom8,
          child5To7Guests,
          childUnder5Guests,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        booking?: {
          bookingCode?: string;
        };
        remainingSeats?: number;
        inquiryReferenceCode?: string | null;
      };

      if (!response.ok) {
        if (response.status === 409 && typeof payload.remainingSeats === "number") {
          const reportedInquiryCode =
            payload.inquiryReferenceCode ??
            (await reportCapacityShortage({
              requestedGuests: computedTotalGuests,
              remainingSeats: payload.remainingSeats,
            }));
          const inquiryText = reportedInquiryCode
            ? `Chúng tôi đã ghi nhận yêu cầu (${reportedInquiryCode}) và sẽ liên hệ bạn sớm để hỗ trợ.`
            : "Chúng tôi đã ghi nhận yêu cầu và sẽ liên hệ bạn sớm để hỗ trợ.";
          
          toast.error(payload.message ?? "Không thể đặt tour, vui lòng thử lại.", { description: inquiryText });
          return;
        }
        toast.error(payload.message ?? "Không thể đặt tour, vui lòng thử lại.");
        return;
      }

      toast.success(payload.message ?? "Đặt tour thành công.");
      const createdCode = payload.booking?.bookingCode ?? null;
      setLastBookingCode(createdCode);
      const remainingSeats = payload.remainingSeats;
      if (typeof remainingSeats === "number" && departureDate) {
        setAvailability((prev) =>
          prev
            ? {
                ...prev,
                remainingSeats,
                bookedGuests: Math.max(prev.maxGuests - remainingSeats, 0),
                isFull: remainingSeats <= 0,
              }
            : prev,
        );
      }
      router.push(createdCode ? `/booking/thanh-cong?code=${encodeURIComponent(createdCode)}` : "/booking/thanh-cong");
      setActiveStep(1);
      setIsConfirmChecked(false);
      reset({
        ...values,
        tourId,
        numberOfGuests: 1,
        guestsFrom8: 1,
        child5To7Guests: 0,
        childUnder5Guests: 0,
        note: "",
        departureDate: "",
      });
    } catch {
      toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
    }
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

      const payload = (await response.json().catch(() => ({}))) as { message?: string; isFavorite?: boolean };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật yêu thích, vui lòng thử lại.");
        return;
      }

      setIsFavorite(payload.isFavorite ?? false);
      toast.success(payload.message ?? "Đã cập nhật danh sách yêu thích.");
    } catch {
      toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
    } finally {
      setIsFavoriteSubmitting(false);
    }
  }

  async function reportCapacityShortage(input: {
    requestedGuests: number;
    remainingSeats: number;
  }) {
    if (!isLoggedIn) return null;
    if (!departureDate || !isIsoDateInput(departureDate)) return null;

    const fullName = getValues("fullName")?.trim();
    const email = getValues("email")?.trim();
    const phone = getValues("phone")?.trim();
    if (!fullName || !email || !phone) return null;

    const dedupeKey = [
      tourId,
      departureDate,
      fullName,
      phone,
      input.requestedGuests,
      input.remainingSeats,
    ].join("|");
    if (reportedCapacityShortageKeysRef.current.has(dedupeKey)) {
      return null;
    }

    const message = [
      "Khách đặt tour vượt số chỗ còn lại.",
      `Số khách yêu cầu: ${input.requestedGuests}.`,
      `Số chỗ còn lại: ${input.remainingSeats}.`,
      "Nhờ admin liên hệ để thương lượng đổi ngày hoặc điều chỉnh số khách.",
    ].join(" ");

    try {
      const response = await fetch("/api/contact-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          tourId,
          numberOfGuests: input.requestedGuests,
          departureDate,
          message,
        }),
      });

      if (response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          referenceCode?: string;
        };
        reportedCapacityShortageKeysRef.current.add(dedupeKey);
        return payload.referenceCode ?? null;
      }
    } catch {
      // Không chặn UX đặt tour nếu luồng ghi nhận tư vấn bị lỗi mạng tạm thời.
    }

    return null;
  }

  return (
    <div className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Tóm tắt đặt tour</h3>
      <p className="text-sm text-muted-foreground">{shortDescription}</p>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Đơn giá mỗi khách</p>
        <p className="text-2xl font-black text-primary">{formatPrice(unitPrice)}</p>
        {unitPrice !== originalPrice ? (
          <p className="text-sm text-muted-foreground line-through">
            Giá gốc: {formatPrice(originalPrice)}/khách
          </p>
        ) : null}
        <p className="text-sm font-semibold text-slate-800">
          Tạm tính ({computedTotalGuests} khách): {formatPrice(totalPrice)}
        </p>
      </div>

      <details className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
        <summary className="cursor-pointer list-none font-semibold text-slate-900">
          Điều kiện giá
        </summary>
        <ul className="mt-1 space-y-1">
          <li>Khách người lớn (từ 8 tuổi): 100% đơn giá.</li>
          <li>Khách từ 5 đến 7 tuổi: 50% đơn giá.</li>
          <li>Khách dưới 5 tuổi: miễn phí (0%).</li>
        </ul>
      </details>

      <details className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <summary className="cursor-pointer list-none font-semibold text-amber-950">
          Chính sách trước khi xác nhận
        </summary>
        <ul className="mt-1 space-y-1">
          {bookingPolicies.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </details>

      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-primary" />
        Có thể chọn ngày khởi hành linh hoạt
      </p>

      {status === "loading" ? <div className="h-10 animate-pulse rounded-xl bg-muted" /> : null}

      {!isLoggedIn && status !== "loading" ? (
        <Link
          href={loginHref}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Đăng nhập để đặt tour
        </Link>
      ) : null}

      {isLoggedIn ? (
        <form onSubmit={onSubmitBooking} className="space-y-3 border-t pt-4">
          <div className="grid grid-cols-3 gap-2">
            {BOOKING_STEPS.map((step) => {
              const isActive = step.key === activeStep;
              const isDone = step.key < activeStep;
              return (
                <div
                  key={step.key}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-center text-xs font-medium",
                    isDone && "border-teal-200 bg-teal-50 text-teal-700",
                    isActive && "border-primary bg-primary/10 text-primary",
                    !isActive && !isDone && "border-slate-200 bg-slate-50 text-slate-500",
                  )}
                >
                  <p>{step.title}</p>
                </div>
              );
            })}
          </div>

          {lastBookingCode ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-semibold">Đặt tour thành công</p>
              <p className="mt-1 text-xs">
                Mã đơn của bạn: <span className="font-bold">{lastBookingCode}</span>
              </p>
              <Link href="/tai-khoan" className="mt-2 inline-flex text-xs font-semibold text-emerald-700 underline">
                Xem chi tiết trong trang tài khoản
              </Link>
            </div>
          ) : null}

          {activeStep === 1 ? (
            <div className="space-y-3">
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
            </div>
          ) : null}

          {activeStep === 2 ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`guests-from-8-${tourId}`}>Khách người lớn (từ 8 tuổi)</Label>
                  <Input
                    id={`guests-from-8-${tourId}`}
                    type="number"
                    min={1}
                    max={maxGuests}
                    {...register("guestsFrom8", { valueAsNumber: true })}
                  />
                  {errors.guestsFrom8 ? (
                    <p className="text-xs text-destructive">{errors.guestsFrom8.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tối đa {maxGuests} khách cho một đơn.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`child-5-to-7-${tourId}`}>Trẻ em 5-7 tuổi</Label>
                  <Input
                    id={`child-5-to-7-${tourId}`}
                    type="number"
                    min={0}
                    max={maxGuests}
                    {...register("child5To7Guests", { valueAsNumber: true })}
                  />
                  {errors.child5To7Guests ? (
                    <p className="text-xs text-destructive">{errors.child5To7Guests.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`child-under-5-${tourId}`}>Trẻ em dưới 5 tuổi</Label>
                  <Input
                    id={`child-under-5-${tourId}`}
                    type="number"
                    min={0}
                    max={maxGuests}
                    {...register("childUnder5Guests", { valueAsNumber: true })}
                  />
                  {errors.childUnder5Guests ? (
                    <p className="text-xs text-destructive">{errors.childUnder5Guests.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`total-guests-${tourId}`}>Tổng số khách</Label>
                  <Input id={`total-guests-${tourId}`} type="number" value={computedTotalGuests} readOnly />
                  {errors.numberOfGuests ? (
                    <p className="text-xs text-destructive">{errors.numberOfGuests.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Bao gồm cả người lớn và trẻ em.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`departure-${tourId}`}>Ngày đi</Label>
                <Input id={`departure-${tourId}`} type="date" min={minDepartureDate} {...register("departureDate")} />
                {errors.departureDate ? (
                  <p className="text-xs text-destructive">{errors.departureDate.message}</p>
                ) : isLoadingAvailability ? (
                  <p className="text-xs text-muted-foreground">Đang kiểm tra số chỗ trống...</p>
                ) : availability ? (
                  <div className="space-y-1">
                    {(() => {
                      const nextRemaining = Math.max(availability.remainingSeats - computedTotalGuests, 0);
                      return (
                        <>
                          <p className="text-xs text-slate-600">
                            Hiện tại: Đã đặt {availability.bookedGuests}/{availability.maxGuests} • Còn{" "}
                            {availability.remainingSeats} chỗ
                          </p>
                          <p
                            className={cn(
                              "text-xs font-medium",
                              nextRemaining > 0 ? "text-emerald-700" : "text-rose-600",
                            )}
                          >
                            Nếu đặt {computedTotalGuests} khách: còn {nextRemaining} chỗ
                          </p>
                        </>
                      );
                    })()}
                  </div>
                ) : availabilityError ? (
                  <p className="text-xs text-destructive">{availabilityError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chọn ngày đi để xem số chỗ còn lại theo dữ liệu thực tế.
                  </p>
                )}
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
            </div>
          ) : null}

          {activeStep === 3 ? (
            <div className="space-y-3">
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <p className="font-medium">Thông tin xác nhận</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Họ tên: {bookingSummary.fullName || "-"}</li>
                  <li>Email: {bookingSummary.email || "-"}</li>
                  <li>Điện thoại: {bookingSummary.phone || "-"}</li>
                  <li>Khách người lớn (từ 8 tuổi): {guestsFrom8}</li>
                  <li>Trẻ em 5-7 tuổi: {child5To7Guests}</li>
                  <li>Trẻ em dưới 5 tuổi: {childUnder5Guests}</li>
                  <li>Tổng số khách: {computedTotalGuests}</li>
                  <li>Ngày đi: {bookingSummary.departureDate || "Linh hoạt"}</li>
                  <li>Đơn giá người lớn: {formatPrice(adultUnitPrice)}/khách</li>
                  {child5To7Guests > 0 ? (
                    <li>
                      Đơn giá trẻ em 5-7 tuổi (50%): {formatPrice(child5To7UnitPrice)}/khách
                    </li>
                  ) : null}
                  {childUnder5Guests > 0 ? (
                    <li>
                      Đơn giá trẻ em dưới 5 tuổi (0%): {formatPrice(childUnder5UnitPrice)}/khách
                    </li>
                  ) : null}
                </ul>
              </div>

              <div className="rounded-xl border bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <p className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Sau khi gửi, đơn của bạn sẽ ở trạng thái chờ xác nhận.
                </p>
              </div>

              <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isConfirmChecked}
                  onChange={(event) => setIsConfirmChecked(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span>Tôi đã kiểm tra thông tin và xác nhận đặt tour với dữ liệu trên.</span>
              </label>

              <details className="rounded-xl border bg-muted/40 p-3 text-sm">
                <summary className="cursor-pointer list-none font-medium">
                  Xem chi tiết cách tính tiền
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>
                    Người lớn: {guestsFrom8} x {formatPrice(adultUnitPrice)} = {formatPrice(adultsTotalPrice)}
                  </li>
                  {child5To7Guests > 0 ? (
                    <li>
                      Trẻ em 5-7 tuổi: {child5To7Guests} x {formatPrice(child5To7UnitPrice)} ={" "}
                      {formatPrice(child5To7TotalPrice)}
                    </li>
                  ) : null}
                  {childUnder5Guests > 0 ? (
                    <li>
                      Trẻ em dưới 5 tuổi: {childUnder5Guests} x {formatPrice(childUnder5UnitPrice)} ={" "}
                      {formatPrice(childUnder5TotalPrice)}
                    </li>
                  ) : null}
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cơ cấu: {guestsFrom8} người lớn + {child5To7Guests} trẻ em 5-7 tuổi + {childUnder5Guests} trẻ em dưới 5 tuổi.
                </p>
              </details>
            </div>
          ) : null}

          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
            <p className="font-semibold text-primary">Tổng tạm tính: {formatPrice(totalPrice)}</p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-10 flex-1" onClick={goToPreviousStep} disabled={activeStep === 1 || isSubmitting}>
              Quay lại
            </Button>

            {activeStep < 3 ? (
              <Button type="button" className="h-10 flex-1" onClick={goToNextStep} disabled={isSubmitting}>
                Tiếp tục
              </Button>
            ) : (
              <Button type="submit" className="h-10 flex-1" disabled={isSubmitting || !isConfirmChecked}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  "Xác nhận đặt tour"
                )}
              </Button>
            )}
          </div>
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
          <p className="text-xs text-muted-foreground">
            <Link href={loginHref} className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>{" "}
            để lưu tour vào danh sách yêu thích của bạn.
          </p>
        ) : null}
      </div>

    </div>
  );
}



