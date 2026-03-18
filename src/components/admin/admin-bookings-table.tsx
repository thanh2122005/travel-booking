"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminBookingActions } from "@/components/admin/admin-booking-actions";
import { AdminBookingDetailDialog } from "@/components/admin/admin-booking-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils/format";

type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentStatusValue = "UNPAID" | "PAID";

type BookingItem = {
  id: string;
  bookingCode: string;
  fullName: string;
  email: string;
  phone: string;
  numberOfGuests: number;
  note?: string | null;
  paymentMethod?: string;
  departureDate?: Date | string | null;
  totalPrice: number;
  status: BookingStatusValue;
  paymentStatus: PaymentStatusValue;
  createdAt: Date | string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  tour: {
    id: string;
    title: string;
    slug: string;
    price: number;
    discountPrice: number | null;
    maxGuests: number;
    departureLocation: string;
  };
};

type AdminBookingsTableProps = {
  items: BookingItem[];
  statusLabels: Record<BookingStatusValue, string>;
  paymentLabels: Record<PaymentStatusValue, string>;
};

const bookingStatusOptions: Array<{ value: BookingStatusValue; label: string }> = [
  { value: "PENDING", label: "Chá» xÃ¡c nháº­n" },
  { value: "CONFIRMED", label: "ÄÃ£ xÃ¡c nháº­n" },
  { value: "CANCELLED", label: "ÄÃ£ há»§y" },
  { value: "COMPLETED", label: "HoÃ n thÃ nh" },
];

const paymentStatusOptions: Array<{ value: PaymentStatusValue; label: string }> = [
  { value: "UNPAID", label: "ChÆ°a thanh toÃ¡n" },
  { value: "PAID", label: "ÄÃ£ thanh toÃ¡n" },
];

export function AdminBookingsTable({
  items,
  statusLabels,
  paymentLabels,
}: AdminBookingsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPaymentStatus, setBulkPaymentStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const selectedIdsInPage = useMemo(
    () => selectedIds.filter((id) => itemIds.includes(id)),
    [itemIds, selectedIds],
  );
  const isAllSelected = itemIds.length > 0 && selectedIdsInPage.length === itemIds.length;

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...itemIds]));
      return prev.filter((id) => !itemIds.includes(id));
    });
  }

  function toggleItem(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  }

  function handleBulkUpdate() {
    if (!selectedIdsInPage.length) {
      toast.error("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t booking Ä‘á»ƒ cáº­p nháº­t.");
      return;
    }

    if (!bulkStatus && !bulkPaymentStatus) {
      toast.error("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t trÆ°á»ng cáº§n cáº­p nháº­t hÃ ng loáº¡t.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/bookings/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIdsInPage,
          ...(bulkStatus ? { status: bulkStatus } : {}),
          ...(bulkPaymentStatus ? { paymentStatus: bulkPaymentStatus } : {}),
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "KhÃ´ng thá»ƒ cáº­p nháº­t booking hÃ ng loáº¡t.");
        return;
      }

      setSelectedIds([]);
      setBulkStatus("");
      setBulkPaymentStatus("");
      toast.success(payload.message ?? "ÄÃ£ cáº­p nháº­t booking hÃ ng loáº¡t.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-card border border-teal-100/70 bg-gradient-to-br from-white via-white to-teal-50/40 p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cáº­p nháº­t hÃ ng loáº¡t</p>
              <p className="mt-1 text-sm text-slate-600">
                ÄÃ£ chá»n <span className="font-semibold text-slate-800">{selectedIdsInPage.length}</span> booking trong trang hiá»‡n táº¡i.
              </p>
            </div>
            {selectedIdsInPage.length ? (
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Bá» chá»n trong trang
              </button>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              Chá»n táº¥t cáº£ trong trang
            </label>
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">KhÃ´ng Ä‘á»•i tráº¡ng thÃ¡i Ä‘Æ¡n</option>
              {bookingStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={bulkPaymentStatus}
              onChange={(event) => setBulkPaymentStatus(event.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">KhÃ´ng Ä‘á»•i tráº¡ng thÃ¡i thanh toÃ¡n</option>
              {paymentStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkUpdate}
              disabled={isPending}
              className="iv-btn-primary inline-flex h-10 w-full items-center justify-center px-5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2 xl:col-span-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Äang cáº­p nháº­t...
                </>
              ) : (
                "Ãp dá»¥ng cho cÃ¡c dÃ²ng Ä‘Ã£ chá»n"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((booking) => (
          <article key={booking.id} className="iv-card p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIdsInPage.includes(booking.id)}
                onChange={(event) => toggleItem(booking.id, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{booking.bookingCode}</p>
                    <p className="text-xs text-slate-500">{formatDate(new Date(booking.createdAt))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{formatPrice(booking.totalPrice)}</p>
                    <p className="text-xs text-slate-500">{booking.numberOfGuests} khÃ¡ch</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">{booking.fullName}</p>
                  <p className="text-xs text-slate-500">{booking.email}</p>
                </div>

                <p className="text-sm text-slate-700">
                  Tour:{" "}
                  <Link href={`/tours/${booking.tour.slug}`} className="font-semibold text-teal-700 hover:text-teal-800">
                    {booking.tour.title}
                  </Link>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{statusLabels[booking.status]}</Badge>
                  <Badge variant="outline">{paymentLabels[booking.paymentStatus]}</Badge>
                </div>

                <div className="space-y-2">
                  <AdminBookingActions
                    bookingId={booking.id}
                    status={booking.status}
                    paymentStatus={booking.paymentStatus}
                  />
                  <AdminBookingDetailDialog booking={booking} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="iv-card hidden lg:block">
        <div className="overflow-x-auto p-4">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-teal-600"
                  />
                </th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">ÄÆ¡n Ä‘áº·t</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Tour</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">GiÃ¡ trá»‹</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Cáº­p nháº­t</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap text-right">Thao tÃ¡c</th>
              </tr>
            </thead>
            <tbody>
              {items.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-2 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIdsInPage.includes(booking.id)}
                      onChange={(event) => toggleItem(booking.id, event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
                    />
                  </td>
                  <td className="px-2 py-3 min-w-[180px]">
                    <p className="font-semibold text-slate-800">{booking.bookingCode}</p>
                    <p className="mt-1 font-medium text-slate-800">{booking.fullName}</p>
                    <p className="text-xs text-slate-500">{booking.email}</p>
                  </td>
                  <td className="px-2 py-3 min-w-[220px]">
                    <Link href={`/tours/${booking.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                      {booking.tour.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{booking.numberOfGuests} khÃ¡ch</p>
                  </td>
                  <td className="px-2 py-3 min-w-[150px]">
                    <p className="font-medium text-slate-800">{formatPrice(booking.totalPrice)}</p>
                    <p className="mt-1 text-xs text-slate-500">{booking.paymentMethod || "Thanh toÃ¡n tiÃªu chuáº©n"}</p>
                  </td>
                  <td className="px-2 py-3 min-w-[190px]">
                    <div className="space-y-2">
                      <Badge variant="outline">{statusLabels[booking.status]}</Badge>
                      <div>
                        <Badge variant="outline">{paymentLabels[booking.paymentStatus]}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(new Date(booking.createdAt))}</p>
                    </div>
                  </td>
                  <td className="px-2 py-3 border-l border-slate-100">
                    <div className="ml-auto flex min-w-[180px] flex-col items-end gap-2">
                      <AdminBookingActions
                        bookingId={booking.id}
                        status={booking.status}
                        paymentStatus={booking.paymentStatus}
                        compact
                      />
                      <AdminBookingDetailDialog booking={booking} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

