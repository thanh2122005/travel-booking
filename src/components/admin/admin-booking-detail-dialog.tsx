"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookingTicketCard } from "@/components/booking/booking-ticket-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getBookingPaymentPresentation, hasPaymentRequest } from "@/lib/utils/booking-payment";
import { resolveBookingGuestBreakdown } from "@/lib/utils/booking-breakdown";
import { formatDate, formatPrice } from "@/lib/utils/format";

type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentStatusValue = "UNPAID" | "PAID";
type BookingActivityAction =
  | "BOOKING_STATUS_UPDATED"
  | "BOOKING_PAYMENT_UPDATED"
  | "BOOKING_TICKET_ISSUED"
  | "BOOKING_CHECKED_IN"
  | "BOOKING_DETAIL_UPDATED";

type BookingActivityItem = {
  id: string;
  action: BookingActivityAction;
  actorName?: string | null;
  detailJson?: string | null;
  createdAt: string;
};

type AdminBookingDetailDialogProps = {
  booking: {
    id: string;
    bookingCode: string;
    fullName: string;
    email: string;
    phone: string;
    numberOfGuests: number;
    totalPrice: number;
    guestsFrom8?: number | null;
    child5To7Guests?: number | null;
    childUnder5Guests?: number | null;
    roomType?: "DOUBLE" | "SINGLE" | null;
    pickupMethod?: "SELF_ARRIVAL" | "NEED_PICKUP" | null;
    pickupLocation?: string | null;
    baseGuestTotal?: number | null;
    roomSurchargeTotal?: number | null;
    unitPriceSnapshot?: number | null;
    child5To7RatioSnapshot?: number | null;
    childUnder5RatioSnapshot?: number | null;
    singleRoomSurchargePerAdultSnapshot?: number | null;
    durationNightsSnapshot?: number | null;
    note?: string | null;
    paymentMethod?: string;
    departureDate?: Date | string | null;
    paymentRequestedAt?: Date | string | null;
    paymentVerifiedAt?: Date | string | null;
    paymentVerifiedByName?: string | null;
    ticketCode?: string | null;
    checkInCode?: string | null;
    ticketIssuedAt?: Date | string | null;
    checkedInAt?: Date | string | null;
    checkedInById?: string | null;
    checkedInByName?: string | null;
    status: BookingStatusValue;
    paymentStatus: PaymentStatusValue;
    tour: {
      title: string;
      maxGuests: number;
      price: number;
      discountPrice: number | null;
    };
  };
};

const CHILD_5_TO_7_PRICE_RATIO = 0.5;
const CHILD_UNDER_5_PRICE_RATIO = 0;
const ACTIVITY_ACTION_LABELS: Record<BookingActivityAction, string> = {
  BOOKING_STATUS_UPDATED: "Cập nhật trạng thái đơn",
  BOOKING_PAYMENT_UPDATED: "Cập nhật trạng thái thanh toán",
  BOOKING_TICKET_ISSUED: "Phát hành vé/mã check-in",
  BOOKING_CHECKED_IN: "Đánh dấu đã check-in",
  BOOKING_DETAIL_UPDATED: "Cập nhật chi tiết đơn đặt tour",
};

const DETAIL_KEY_LABELS: Record<string, string> = {
  status: "Trạng thái đơn",
  paymentStatus: "Trạng thái thanh toán",
  ticketCode: "Mã vé",
  checkInCode: "Mã check-in",
  source: "Nguồn cập nhật",
  mode: "Chế độ",
};

const FIELD_LABELS: Record<string, string> = {
  fullName: "Họ tên",
  email: "Email",
  phone: "Số điện thoại",
  numberOfGuests: "Số khách",
  note: "Ghi chú",
  departureDate: "Ngày khởi hành",
  paymentMethod: "Phương thức thanh toán",
  roomType: "Loại phòng",
  singleRoomGuests: "Số khách ở phòng đơn",
  pickupMethod: "Nhu cầu đón",
  pickupLocation: "Điểm đón mong muốn",
  status: "Trạng thái đơn",
  paymentStatus: "Trạng thái thanh toán",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn thành",
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  SELF_ARRIVAL: "Tự đến điểm hẹn",
  NEED_PICKUP: "Cần hỗ trợ đón",
};

function formatLogDetail(detailJson?: string | null) {
  if (!detailJson) return "";

  try {
    const parsed = JSON.parse(detailJson) as Record<string, unknown>;
    const lines: string[] = [];

    for (const [key, value] of Object.entries(parsed)) {
      if (value === null || value === undefined || value === "") continue;

      if (key === "changedFields" && Array.isArray(value)) {
        const labels = value
          .map((item) => String(item))
          .map((field) => FIELD_LABELS[field] ?? field);
        if (labels.length) {
          lines.push(`Trường thay đổi: ${labels.join(", ")}`);
        }
        continue;
      }

      const label = DETAIL_KEY_LABELS[key] ?? key;
      const resolvedValue =
        typeof value === "string" && STATUS_LABELS[value] ? STATUS_LABELS[value] : String(value);
      lines.push(`${label}: ${resolvedValue}`);
    }

    return lines.join(" • ");
  } catch {
    return detailJson;
  }
}

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function AdminBookingDetailDialog({ booking }: AdminBookingDetailDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCheckInPending, startCheckInTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(booking.fullName);
  const [email, setEmail] = useState(booking.email);
  const [phone, setPhone] = useState(booking.phone);
  const [numberOfGuests, setNumberOfGuests] = useState(String(booking.numberOfGuests));
  const [note, setNote] = useState(booking.note ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    booking.paymentMethod ?? "Thanh toán khi xác nhận",
  );
  const [roomType, setRoomType] = useState<"DOUBLE" | "SINGLE">(booking.roomType === "SINGLE" ? "SINGLE" : "DOUBLE");
  const [pickupMethod, setPickupMethod] = useState<"SELF_ARRIVAL" | "NEED_PICKUP">(
    booking.pickupMethod === "NEED_PICKUP" ? "NEED_PICKUP" : "SELF_ARRIVAL",
  );
  const [pickupLocation, setPickupLocation] = useState(booking.pickupLocation ?? "");
  const [departureDate, setDepartureDate] = useState(toDateInputValue(booking.departureDate));
  const [status, setStatus] = useState<BookingStatusValue>(booking.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusValue>(booking.paymentStatus);
  const [checkedInAt, setCheckedInAt] = useState<Date | string | null>(booking.checkedInAt ?? null);
  const [checkedInByName, setCheckedInByName] = useState<string | null>(booking.checkedInByName ?? null);
  const [activityLogs, setActivityLogs] = useState<BookingActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const paymentPresentation = getBookingPaymentPresentation(booking);
  const paymentRequested = hasPaymentRequest(booking);

  const unitPrice = booking.unitPriceSnapshot ?? booking.tour.discountPrice ?? booking.tour.price;
  const child5To7Ratio = booking.child5To7RatioSnapshot ?? CHILD_5_TO_7_PRICE_RATIO;
  const childUnder5Ratio = booking.childUnder5RatioSnapshot ?? CHILD_UNDER_5_PRICE_RATIO;
  const singleRoomSurchargePerAdult = booking.singleRoomSurchargePerAdultSnapshot ?? 0;
  const durationNights = Math.max(booking.durationNightsSnapshot ?? 0, 0);
  const canUseSingleRoom = durationNights > 0;
  const inferredSingleRoomGuests = useMemo(() => {
    if (
      typeof booking.roomSurchargeTotal === "number" &&
      booking.roomSurchargeTotal > 0 &&
      singleRoomSurchargePerAdult > 0 &&
      durationNights > 0
    ) {
      return Math.max(1, Math.round(booking.roomSurchargeTotal / (singleRoomSurchargePerAdult * durationNights)));
    }
    return booking.roomType === "SINGLE" ? Math.max(1, booking.numberOfGuests) : 0;
  }, [
    booking.numberOfGuests,
    booking.roomSurchargeTotal,
    booking.roomType,
    durationNights,
    singleRoomSurchargePerAdult,
  ]);
  const [singleRoomGuests, setSingleRoomGuests] = useState(String(inferredSingleRoomGuests));
  const guestBreakdown = useMemo(() => {
    const baseBreakdown = resolveBookingGuestBreakdown({
      numberOfGuests: booking.numberOfGuests,
      totalPrice: booking.totalPrice,
      unitPrice,
      guestsFrom8: booking.guestsFrom8,
      child5To7Guests: booking.child5To7Guests,
      childUnder5Guests: booking.childUnder5Guests,
    });
    const guests = Number(numberOfGuests);
    if (!Number.isFinite(guests) || guests <= 0) {
      return baseBreakdown;
    }

    const nextGuests = Math.trunc(guests);
    if (nextGuests !== booking.numberOfGuests) {
      // Khi admin sửa nhanh tổng số khách thì preview quy về nhóm người lớn.
      return {
        adults: nextGuests,
        child5To7: 0,
        childUnder5: 0,
        total: nextGuests,
      };
    }

    return baseBreakdown;
  }, [
    booking.child5To7Guests,
    booking.childUnder5Guests,
    booking.guestsFrom8,
    booking.numberOfGuests,
    booking.totalPrice,
    numberOfGuests,
    unitPrice,
  ]);

  const estimatedTotal = useMemo(
    () => {
      const baseGuestTotal = Math.round(
        unitPrice *
          (guestBreakdown.adults +
            guestBreakdown.child5To7 * child5To7Ratio +
            guestBreakdown.childUnder5 * childUnder5Ratio),
      );
      const roomSurchargeTotal =
        canUseSingleRoom && roomType === "SINGLE"
          ? Math.round(Math.max(1, Math.min(guestBreakdown.total, Number(singleRoomGuests))) * singleRoomSurchargePerAdult * durationNights)
          : 0;
      return baseGuestTotal + roomSurchargeTotal;
    },
    [
      canUseSingleRoom,
      child5To7Ratio,
      childUnder5Ratio,
      durationNights,
      guestBreakdown.adults,
      guestBreakdown.child5To7,
      guestBreakdown.childUnder5,
      guestBreakdown.total,
      roomType,
      singleRoomGuests,
      singleRoomSurchargePerAdult,
      unitPrice,
    ],
  );

  const adultTotal = guestBreakdown.adults * unitPrice;
  const child5To7Total = Math.round(guestBreakdown.child5To7 * unitPrice * child5To7Ratio);
  const childUnder5Total = Math.round(guestBreakdown.childUnder5 * unitPrice * childUnder5Ratio);
  const roomSurchargeTotal =
    canUseSingleRoom && roomType === "SINGLE"
      ? Math.round(Math.max(1, Math.min(guestBreakdown.total, Number(singleRoomGuests))) * singleRoomSurchargePerAdult * durationNights)
      : 0;
  const resolvedSingleRoomGuests =
    canUseSingleRoom && roomType === "SINGLE"
      ? Math.max(
          1,
          Math.min(
            guestBreakdown.total,
            Number.isFinite(Number(singleRoomGuests)) ? Math.trunc(Number(singleRoomGuests)) : 1,
          ),
        )
      : 0;

  useEffect(() => {
    if (roomType !== "SINGLE") {
      setSingleRoomGuests("0");
      return;
    }
    const numeric = Number(singleRoomGuests);
    if (!Number.isFinite(numeric) || numeric < 1) {
      setSingleRoomGuests(String(Math.max(1, Math.min(guestBreakdown.total, inferredSingleRoomGuests || 1))));
      return;
    }
    if (numeric > guestBreakdown.total) {
      setSingleRoomGuests(String(Math.max(1, guestBreakdown.total)));
    }
  }, [guestBreakdown.total, inferredSingleRoomGuests, roomType, singleRoomGuests]);

  const loadActivityLogs = useCallback(async () => {
    setIsActivityLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/activity`, {
        method: "GET",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        items?: BookingActivityItem[];
      };
      if (!response.ok) return;
      setActivityLogs(Array.isArray(payload.items) ? payload.items : []);
    } finally {
      setIsActivityLoading(false);
    }
  }, [booking.id]);

  useEffect(() => {
    if (!open) return;
    void loadActivityLogs();
  }, [loadActivityLogs, open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const guests = Number(numberOfGuests);
    if (!Number.isFinite(guests) || guests <= 0) {
      toast.error("Số khách phải lớn hơn 0.");
      return;
    }
    if (guests > booking.tour.maxGuests) {
      toast.error(`Số khách vượt quá giới hạn tour (${booking.tour.maxGuests} khách).`);
      return;
    }
    if (roomType === "SINGLE" && !canUseSingleRoom) {
      toast.error("Tour không áp dụng loại phòng đơn.");
      return;
    }
    const parsedSingleRoomGuests = Number(singleRoomGuests);
    if (
      roomType === "SINGLE" &&
      (!Number.isFinite(parsedSingleRoomGuests) ||
        parsedSingleRoomGuests < 1 ||
        parsedSingleRoomGuests > guestBreakdown.total)
    ) {
      toast.error(`Số khách ở phòng đơn phải từ 1 đến ${Math.max(guestBreakdown.total, 1)}.`);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/bookings/${booking.id}/detail`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            numberOfGuests: Math.trunc(guests),
            note: note.trim().length ? note.trim() : null,
            paymentMethod: paymentMethod.trim(),
            roomType,
            singleRoomGuests:
              roomType === "SINGLE"
                ? Math.max(1, Math.min(guestBreakdown.total, Math.trunc(parsedSingleRoomGuests)))
                : 0,
            pickupMethod,
            pickupLocation: pickupMethod === "NEED_PICKUP" ? pickupLocation.trim() || null : null,
            departureDate: departureDate || null,
            status,
            paymentStatus,
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          toast.error(payload.message ?? "Không thể cập nhật đơn đặt tour.");
          return;
        }

        toast.success(payload.message ?? "Đã cập nhật đơn đặt tour.");
        setOpen(false);
        router.refresh();
        void loadActivityLogs();
      } catch {
        toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
      }
    });
  }

  function handleMarkCheckIn() {
    startCheckInTransition(async () => {
      try {
        const response = await fetch(`/api/admin/bookings/${booking.id}/check-in`, {
          method: "POST",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
          booking?: {
            checkedInAt?: string | null;
            checkedInByName?: string | null;
          };
        };
        if (!response.ok) {
          if (response.status === 409) {
            // Đồng bộ UI ngay cả khi backend báo đã check-in trước đó.
            setCheckedInAt((prev) => prev ?? new Date().toISOString());
            setCheckedInByName((prev) => prev ?? "Quản trị viên");
            toast.message(payload.message ?? "Đơn đã được check-in trước đó.");
            return;
          }
          toast.error(payload.message ?? "Không thể đánh dấu check-in.");
          return;
        }

        setCheckedInAt(payload.booking?.checkedInAt ?? new Date().toISOString());
        setCheckedInByName(payload.booking?.checkedInByName ?? "Quản trị viên");
        toast.success(payload.message ?? "Đã đánh dấu check-in.");
        void loadActivityLogs();
      } catch {
        toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 w-full items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
        Sửa chi tiết
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cập nhật đơn {booking.bookingCode}</DialogTitle>
          <DialogDescription>
            Chỉnh thông tin khách, ngày đi và trạng thái xử lý cho đơn tour {booking.tour.title}.
          </DialogDescription>
        </DialogHeader>

        <form id="admin-booking-detail-form" onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Họ và tên</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Số điện thoại</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Số khách</label>
            <input
              type="number"
              min={1}
              max={booking.tour.maxGuests}
              value={numberOfGuests}
              onChange={(event) => setNumberOfGuests(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Ngày khởi hành</label>
            <input
              type="date"
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Loại phòng</label>
            <select
              value={roomType}
              onChange={(event) => setRoomType(event.target.value as "DOUBLE" | "SINGLE")}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="DOUBLE">Phòng đôi</option>
              <option value="SINGLE" disabled={!canUseSingleRoom}>
                Phòng đơn
              </option>
            </select>
            {canUseSingleRoom ? (
              <p className="text-xs text-slate-500">
                Phụ thu phòng đơn: {formatPrice(singleRoomSurchargePerAdult)}/người lớn/đêm ({durationNights} đêm).
              </p>
            ) : (
              <p className="text-xs text-slate-500">Tour không có lưu trú qua đêm, chỉ áp dụng phòng đôi.</p>
            )}
          </div>
          {canUseSingleRoom && roomType === "SINGLE" ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Số khách ở phòng đơn
              </label>
              <input
                type="number"
                min={1}
                max={Math.max(guestBreakdown.total, 1)}
                value={singleRoomGuests}
                onChange={(event) => setSingleRoomGuests(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
              <p className="text-xs text-slate-500">
                Tối đa {guestBreakdown.total} khách theo đơn.
              </p>
            </div>
          ) : null}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Nhu cầu đón</label>
            <select
              value={pickupMethod}
              onChange={(event) => setPickupMethod(event.target.value as "SELF_ARRIVAL" | "NEED_PICKUP")}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="SELF_ARRIVAL">Tự đến điểm hẹn</option>
              <option value="NEED_PICKUP">Cần hỗ trợ đón</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Điểm đón mong muốn
            </label>
            <input
              value={pickupLocation}
              onChange={(event) => setPickupLocation(event.target.value)}
              placeholder="Ví dụ: Big C Thăng Long, Hà Nội"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              disabled={pickupMethod !== "NEED_PICKUP"}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Phương thức thanh toán</label>
            <input
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Trạng thái đơn</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as BookingStatusValue)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Thanh toán</label>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value as PaymentStatusValue)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="UNPAID">Chưa thanh toán / đợi lại xác minh</option>
              <option value="PAID">Đã thanh toán - phát hành vé</option>
            </select>
            <p className="text-xs text-slate-500">{paymentPresentation.description}</p>
            {booking.paymentStatus !== "PAID" ? (
              paymentRequested ? (
                <p className="text-xs text-emerald-700">
                  Khách đã gửi yêu cầu thanh toán
                  {booking.paymentRequestedAt ? ` lúc ${toDateInputValue(booking.paymentRequestedAt)}` : ""}.
                </p>
              ) : null
            ) : (
              <p className="text-xs text-slate-600">
                Thông tin vé điện tử hiển thị ở phần bên dưới.
              </p>
            )}
            {checkedInAt ? (
              <p className="text-xs font-medium text-teal-700">
                Đã check-in: {formatDate(new Date(checkedInAt))}
                {checkedInByName ? ` • ${checkedInByName}` : ""}
              </p>
            ) : null}
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Ghi chú</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 md:col-span-2">
            <p className="font-semibold text-slate-700">Chi tiết đơn giá theo nhóm tuổi</p>
            <p className="mt-1">
              Người lớn (từ 8 tuổi): {guestBreakdown.adults} x {formatPrice(unitPrice)} ={" "}
              <span className="font-semibold text-slate-900">{formatPrice(adultTotal)}</span>
            </p>
            <p>
              Trẻ em 5-7 tuổi: {guestBreakdown.child5To7} x {formatPrice(Math.round(unitPrice * child5To7Ratio))} ={" "}
              <span className="font-semibold text-slate-900">{formatPrice(child5To7Total)}</span>
            </p>
            <p>
              Trẻ em dưới 5 tuổi: {guestBreakdown.childUnder5} x {formatPrice(Math.round(unitPrice * childUnder5Ratio))} ={" "}
              <span className="font-semibold text-slate-900">{formatPrice(childUnder5Total)}</span>
            </p>
            {roomSurchargeTotal > 0 ? (
              <p>
                Phụ thu phòng đơn: {resolvedSingleRoomGuests} x {formatPrice(singleRoomSurchargePerAdult)} x {durationNights} đêm ={" "}
                <span className="font-semibold text-slate-900">{formatPrice(roomSurchargeTotal)}</span>
              </p>
            ) : null}
            <p className="mt-1">
              Tổng tạm tính: <span className="font-semibold text-slate-900">{formatPrice(estimatedTotal)}</span>
            </p>
          </div>
        </form>
        <div className="sticky bottom-0 z-20 -mx-6 mt-3 border-t border-slate-200 bg-white/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <button
            type="submit"
            form="admin-booking-detail-form"
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang lưu
              </>
            ) : (
              "Lưu chi tiết đơn"
            )}
          </button>
        </div>

        {booking.paymentStatus === "PAID" && booking.ticketCode ? (
          <div className="mt-4 space-y-3">
            <BookingTicketCard
              bookingCode={booking.bookingCode}
              ticketCode={booking.ticketCode}
              checkInCode={booking.checkInCode}
              ticketIssuedAt={booking.ticketIssuedAt}
              paymentRequestedAt={booking.paymentRequestedAt}
              departureDate={booking.departureDate}
              fullName={booking.fullName}
              tourTitle={booking.tour.title}
                verifiedByName={booking.paymentVerifiedByName}
            />
            {checkedInAt ? (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
                Đã check-in: {formatDate(new Date(checkedInAt))}
                {checkedInByName ? ` • ${checkedInByName}` : ""}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleMarkCheckIn}
                disabled={isCheckInPending}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-teal-300 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCheckInPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Đang ghi nhận...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Đánh dấu đã check-in
                  </>
                )}
              </button>
            )}
          </div>
        ) : null}

        <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-sm font-semibold text-slate-800">Nhật ký hoạt động</p>
          {isActivityLoading ? (
            <p className="mt-2 text-xs text-slate-500">Đang tải nhật ký...</p>
          ) : activityLogs.length ? (
            <ul className="mt-2 space-y-2">
              {activityLogs.map((item) => {
                const detail = formatLogDetail(item.detailJson);
                return (
                  <li key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                    <p className="font-medium text-slate-800">
                      {ACTIVITY_ACTION_LABELS[item.action] ?? item.action}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {formatDate(new Date(item.createdAt))}
                      {item.actorName ? ` • ${item.actorName}` : ""}
                    </p>
                    {detail ? <p className="mt-1 text-slate-600">{detail}</p> : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Chưa có nhật ký hoạt động.</p>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}





