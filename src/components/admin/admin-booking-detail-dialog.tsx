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
  const [paymentMethod, setPaymentMethod] = useState(booking.paymentMethod ?? "Thanh toán khi xác nhận");
  const [departureDate, setDepartureDate] = useState(toDateInputValue(booking.departureDate));
  const [status, setStatus] = useState<BookingStatusValue>(booking.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusValue>(booking.paymentStatus);

  const unitPrice = booking.tour.discountPrice ?? booking.tour.price;
  const estimatedTotal = useMemo(() => {
    const guests = Number(numberOfGuests);
    if (!Number.isFinite(guests) || guests <= 0) return unitPrice;
    return unitPrice * Math.trunc(guests);
  }, [numberOfGuests, unitPrice]);

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

    startTransition(async () => {
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
          departureDate: departureDate || null,
          status,
          paymentStatus,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật booking.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật booking.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
        Sửa chi tiết
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cập nhật booking {booking.bookingCode}</DialogTitle>
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
            Tổng tạm tính theo số khách hiện tại:{" "}
            <span className="font-semibold text-slate-900">{formatPrice(estimatedTotal)}</span>
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
              "Lưu chi tiết booking"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
