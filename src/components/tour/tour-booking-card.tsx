"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, Heart, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildCallbackUrl } from "@/lib/auth/callback-url";
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

const BOOKING_STEPS = [
  { key: 1, title: "LiÃªn há»‡" },
  { key: 2, title: "Lá»‹ch trÃ¬nh" },
  { key: 3, title: "XÃ¡c nháº­n" },
] as const;

type BookingStep = (typeof BOOKING_STEPS)[number]["key"];

const STEP_FIELDS: Record<BookingStep, (keyof BookingInput)[]> = {
  1: ["fullName", "email", "phone"],
  2: ["numberOfGuests", "departureDate", "note"],
  3: [],
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
  const [reviewRating, setReviewRating] = useState(initialReview?.rating ?? 5);
  const [reviewComment, setReviewComment] = useState(initialReview?.comment ?? "");
  const [hasExistingReview, setHasExistingReview] = useState(Boolean(initialReview));
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

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
    setReviewRating(initialReview?.rating ?? 5);
    setReviewComment(initialReview?.comment ?? "");
    setHasExistingReview(Boolean(initialReview));
  }, [initialReview]);

  useEffect(() => {
    setActiveStep(1);
  }, [tourId]);

  const numberOfGuests = useWatch({
    control,
    name: "numberOfGuests",
  }) || 1;

  const totalPrice = unitPrice * numberOfGuests;
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

    if (activeStep === 2 && numberOfGuests > maxGuests) {
      toast.error(`Tour nÃ y chá»‰ nháº­n tá»‘i Ä‘a ${maxGuests} khÃ¡ch cho má»™t Ä‘Æ¡n.`);
      return;
    }

    setActiveStep((prev) => (prev < 3 ? ((prev + 1) as BookingStep) : prev));
  }

  function goToPreviousStep() {
    setActiveStep((prev) => (prev > 1 ? ((prev - 1) as BookingStep) : prev));
  }

  const onSubmitBooking = handleSubmit(async (values) => {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as {
      message?: string;
      booking?: {
        bookingCode?: string;
      };
    };

    if (!response.ok) {
      toast.error(payload.message ?? "KhÃ´ng thá»ƒ Ä‘áº·t tour, vui lÃ²ng thá»­ láº¡i.");
      return;
    }

    toast.success(payload.message ?? "Đặt tour thành công.");
    const createdCode = payload.booking?.bookingCode ?? null;
    setLastBookingCode(createdCode);
    router.push(createdCode ? `/booking/thanh-cong?code=${encodeURIComponent(createdCode)}` : "/booking/thanh-cong");
    setActiveStep(1);
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
      toast.error("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ lÆ°u tour yÃªu thÃ­ch.");
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
        toast.error(payload.message ?? "KhÃ´ng thá»ƒ cáº­p nháº­t yÃªu thÃ­ch, vui lÃ²ng thá»­ láº¡i.");
        return;
      }

      setIsFavorite(payload.isFavorite ?? false);
      toast.success(payload.message ?? "ÄÃ£ cáº­p nháº­t danh sÃ¡ch yÃªu thÃ­ch.");
    } finally {
      setIsFavoriteSubmitting(false);
    }
  }

  async function handleSubmitReview() {
    if (!isLoggedIn) {
      toast.error("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ Ä‘Ã¡nh giÃ¡.");
      return;
    }

    const parsed = reviewSchema.safeParse({
      tourId,
      rating: reviewRating,
      comment: reviewComment,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      toast.error(firstIssue?.message ?? "Dá»¯ liá»‡u Ä‘Ã¡nh giÃ¡ khÃ´ng há»£p lá»‡.");
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
        toast.error(payload.message ?? "KhÃ´ng thá»ƒ gá»­i Ä‘Ã¡nh giÃ¡, vui lÃ²ng thá»­ láº¡i.");
        return;
      }

      setHasExistingReview(true);
      toast.success(payload.message ?? "ÄÃ¡nh giÃ¡ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n.");
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">TÃ³m táº¯t Ä‘áº·t tour</h3>
      <p className="text-sm text-muted-foreground">{shortDescription}</p>

      <div>
        <p className="text-xs text-muted-foreground">GiÃ¡ tá»«</p>
        <p className="text-2xl font-black text-primary">{formatPrice(unitPrice)}</p>
        {unitPrice !== originalPrice ? (
          <p className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</p>
        ) : null}
      </div>

      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-primary" />
        CÃ³ thá»ƒ chá»n ngÃ y khá»Ÿi hÃ nh linh hoáº¡t
      </p>

      {status === "loading" ? <div className="h-10 animate-pulse rounded-xl bg-muted" /> : null}

      {!isLoggedIn && status !== "loading" ? (
        <Link
          href={loginHref}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          ÄÄƒng nháº­p Ä‘á»ƒ Ä‘áº·t tour
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
              <p className="font-semibold">Äáº·t tour thÃ nh cÃ´ng</p>
              <p className="mt-1 text-xs">
                MÃ£ Ä‘Æ¡n cá»§a báº¡n: <span className="font-bold">{lastBookingCode}</span>
              </p>
              <Link href="/tai-khoan" className="mt-2 inline-flex text-xs font-semibold text-emerald-700 underline">
                Xem chi tiáº¿t trong trang tÃ i khoáº£n
              </Link>
            </div>
          ) : null}

          {activeStep === 1 ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`fullName-${tourId}`}>Há» vÃ  tÃªn</Label>
                <Input id={`fullName-${tourId}`} placeholder="Nguyá»…n VÄƒn A" {...register("fullName")} />
                {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`email-${tourId}`}>Email</Label>
                <Input id={`email-${tourId}`} type="email" placeholder="ban@example.com" {...register("email")} />
                {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`phone-${tourId}`}>Sá»‘ Ä‘iá»‡n thoáº¡i</Label>
                <Input id={`phone-${tourId}`} type="tel" placeholder="0909123456" {...register("phone")} />
                {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
              </div>
            </div>
          ) : null}

          {activeStep === 2 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`guests-${tourId}`}>Sá»‘ khÃ¡ch</Label>
                  <Input
                    id={`guests-${tourId}`}
                    type="number"
                    min={1}
                    max={maxGuests}
                    {...register("numberOfGuests", { valueAsNumber: true })}
                  />
                  {errors.numberOfGuests ? (
                    <p className="text-xs text-destructive">{errors.numberOfGuests.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tá»‘i Ä‘a {maxGuests} khÃ¡ch cho má»™t Ä‘Æ¡n.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`departure-${tourId}`}>NgÃ y Ä‘i</Label>
                  <Input id={`departure-${tourId}`} type="date" {...register("departureDate")} />
                  {errors.departureDate ? (
                    <p className="text-xs text-destructive">{errors.departureDate.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`note-${tourId}`}>Ghi chÃº</Label>
                <Textarea
                  id={`note-${tourId}`}
                  placeholder="VÃ­ dá»¥: cáº§n há»— trá»£ suáº¥t Äƒn chay, gháº¿ gáº§n nhau..."
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
                <p className="font-medium">ThÃ´ng tin xÃ¡c nháº­n</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Há» tÃªn: {bookingSummary.fullName || "-"}</li>
                  <li>Email: {bookingSummary.email || "-"}</li>
                  <li>Äiá»‡n thoáº¡i: {bookingSummary.phone || "-"}</li>
                  <li>Sá»‘ khÃ¡ch: {numberOfGuests}</li>
                  <li>NgÃ y Ä‘i: {bookingSummary.departureDate || "Linh hoáº¡t"}</li>
                </ul>
              </div>

              <div className="rounded-xl border bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <p className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Sau khi gá»­i, Ä‘Æ¡n cá»§a báº¡n sáº½ á»Ÿ tráº¡ng thÃ¡i chá» xÃ¡c nháº­n.
                </p>
              </div>

              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <p className="font-medium">Tá»•ng táº¡m tÃ­nh: {formatPrice(totalPrice)}</p>
                <p className="text-xs text-muted-foreground">Sá»‘ khÃ¡ch tá»‘i Ä‘a cho Ä‘Æ¡n nÃ y: {maxGuests} ngÆ°á»i.</p>
              </div>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-10 flex-1" onClick={goToPreviousStep} disabled={activeStep === 1 || isSubmitting}>
              Quay láº¡i
            </Button>

            {activeStep < 3 ? (
              <Button type="button" className="h-10 flex-1" onClick={goToNextStep} disabled={isSubmitting}>
                Tiáº¿p tá»¥c
              </Button>
            ) : (
              <Button type="submit" className="h-10 flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Äang gá»­i yÃªu cáº§u...
                  </>
                ) : (
                  "XÃ¡c nháº­n Ä‘áº·t tour"
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
              Äang cáº­p nháº­t...
            </>
          ) : (
            <>
              <Heart className={cn("mr-2 h-4 w-4", isFavorite ? "fill-current" : "")} />
              {isFavorite ? "ÄÃ£ lÆ°u yÃªu thÃ­ch" : "ThÃªm vÃ o yÃªu thÃ­ch"}
            </>
          )}
        </Button>
        {!isLoggedIn ? (
          <p className="text-xs text-muted-foreground">
            <Link href={loginHref} className="font-semibold text-primary hover:underline">
              ÄÄƒng nháº­p
            </Link>{" "}
            Ä‘á»ƒ lÆ°u tour vÃ o danh sÃ¡ch yÃªu thÃ­ch cá»§a báº¡n.
          </p>
        ) : null}
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">ÄÃ¡nh giÃ¡ cá»§a báº¡n</p>
          <p className="text-xs text-muted-foreground">
            Chá»‰ ngÆ°á»i dÃ¹ng cÃ³ Ä‘Æ¡n Ä‘Ã£ xÃ¡c nháº­n hoáº·c Ä‘Ã£ hoÃ n thÃ nh má»›i cÃ³ thá»ƒ gá»­i Ä‘Ã¡nh giÃ¡.
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
                aria-label={`Chá»n ${value} sao`}
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
          placeholder="Chia sáº» tráº£i nghiá»‡m thá»±c táº¿ cá»§a báº¡n vá» tour nÃ y..."
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
              Äang gá»­i Ä‘Ã¡nh giÃ¡...
            </>
          ) : hasExistingReview ? (
            "Cáº­p nháº­t Ä‘Ã¡nh giÃ¡"
          ) : (
            "Gá»­i Ä‘Ã¡nh giÃ¡"
          )}
        </Button>

        {!isLoggedIn ? (
          <p className="text-xs text-muted-foreground">
            <Link href={loginHref} className="font-semibold text-primary hover:underline">
              ÄÄƒng nháº­p
            </Link>{" "}
            Ä‘á»ƒ gá»­i Ä‘Ã¡nh giÃ¡ cho tour nÃ y.
          </p>
        ) : null}
      </div>
    </div>
  );
}


