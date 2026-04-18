"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resolveBookingGuestBreakdown } from "@/lib/utils/booking-breakdown";
import { formatPrice } from "@/lib/utils/format";

type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentStatusValue = "UNPAID" | "PAID";

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

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function AdminBookingDetailDialog({ booking }: AdminBookingDetailDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
  const [departureDate, setDepartureDate] = useState(toDateInputValue(booking.departureDate));
  const [status, setStatus] = useState<BookingStatusValue>(booking.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusValue>(booking.paymentStatus);

  const unitPrice = booking.unitPriceSnapshot ?? booking.tour.discountPrice ?? booking.tour.price;
  const child5To7Ratio = booking.child5To7RatioSnapshot ?? CHILD_5_TO_7_PRICE_RATIO;
  const childUnder5Ratio = booking.childUnder5RatioSnapshot ?? CHILD_UNDER_5_PRICE_RATIO;
  const singleRoomSurchargePerAdult = booking.singleRoomSurchargePerAdultSnapshot ?? 0;
  const durationNights = Math.max(booking.durationNightsSnapshot ?? 0, 0);
  const canUseSingleRoom = durationNights > 0;
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
          ? Math.round(guestBreakdown.adults * singleRoomSurchargePerAdult * durationNights)
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
      roomType,
      singleRoomSurchargePerAdult,
      unitPrice,
    ],
  );

  const adultTotal = guestBreakdown.adults * unitPrice;
  const child5To7Total = Math.round(guestBreakdown.child5To7 * unitPrice * child5To7Ratio);
  const childUnder5Total = Math.round(guestBreakdown.childUnder5 * unitPrice * childUnder5Ratio);
  const roomSurchargeTotal =
    canUseSingleRoom && roomType === "SINGLE"
      ? Math.round(guestBreakdown.adults * singleRoomSurchargePerAdult * durationNights)
      : 0;

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cập nhật đơn {booking.bookingCode}</DialogTitle>
          <DialogDescription>
            Chỉnh thông tin khách, ngày đi và trạng thái xử lý cho đơn tour {booking.tour.title}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
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
              <option value="UNPAID">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
            </select>
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
                Phụ thu phòng đơn: {guestBreakdown.adults} x {formatPrice(singleRoomSurchargePerAdult)} x {durationNights} đêm ={" "}
                <span className="font-semibold text-slate-900">{formatPrice(roomSurchargeTotal)}</span>
              </p>
            ) : null}
            <p className="mt-1">
              Tổng tạm tính: <span className="font-semibold text-slate-900">{formatPrice(estimatedTotal)}</span>
            </p>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 md:col-span-2 md:justify-self-end"
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
        </form>
      </DialogContent>
    </Dialog>
  );
}

