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
  numberOfGuests: number;
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
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

const paymentStatusOptions: Array<{ value: PaymentStatusValue; label: string }> = [
  { value: "UNPAID", label: "Chưa thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
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
      if (checked) {
        return Array.from(new Set([...prev, ...itemIds]));
      }
      return prev.filter((id) => !itemIds.includes(id));
    });
  }

  function toggleItem(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  }

  function handleBulkUpdate() {
    if (!selectedIdsInPage.length) {
      toast.error("Vui lòng chọn ít nhất một booking để cập nhật.");
      return;
    }

    if (!bulkStatus && !bulkPaymentStatus) {
      toast.error("Vui lòng chọn ít nhất một trường cần cập nhật hàng loạt.");
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

      const payload = (await response.json()) as { message?: string; count?: number };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật booking hàng loạt.");
        return;
      }

      setSelectedIds([]);
      setBulkStatus("");
      setBulkPaymentStatus("");
      toast.success(payload.message ?? "Đã cập nhật booking hàng loạt.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Cập nhật hàng loạt
            </p>
            <p className="mt-1 text-sm text-slate-600">
            Đã chọn <span className="font-semibold text-slate-900">{selectedIdsInPage.length}</span>{" "}
            booking.
            </p>
          </div>
          <select
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value)}
            className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Không đổi trạng thái đơn</option>
            {bookingStatusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={bulkPaymentStatus}
            onChange={(event) => setBulkPaymentStatus(event.target.value)}
            className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Không đổi trạng thái thanh toán</option>
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
            className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              "Áp dụng cho các dòng đã chọn"
            )}
          </button>
        </div>
      </div>

      <div className="iv-card overflow-x-auto p-4">
        <table className="w-full min-w-[1040px] text-sm">
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
              <th className="px-2 py-3 font-medium">Mã đơn</th>
              <th className="px-2 py-3 font-medium">Khách hàng</th>
              <th className="px-2 py-3 font-medium">Tour</th>
              <th className="px-2 py-3 font-medium">Số khách</th>
              <th className="px-2 py-3 font-medium">Tổng tiền</th>
              <th className="px-2 py-3 font-medium">Trạng thái</th>
              <th className="px-2 py-3 font-medium">Thanh toán</th>
              <th className="px-2 py-3 font-medium">Ngày tạo</th>
              <th className="px-2 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((booking) => (
              <tr key={booking.id} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={selectedIdsInPage.includes(booking.id)}
                    onChange={(event) => toggleItem(booking.id, event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
                  />
                </td>
                <td className="px-2 py-3 font-semibold text-slate-800">{booking.bookingCode}</td>
                <td className="px-2 py-3">
                  <p className="font-medium text-slate-800">{booking.fullName}</p>
                  <p className="text-xs text-slate-500">{booking.email}</p>
                </td>
                <td className="px-2 py-3">
                  <Link href={`/tours/${booking.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                    {booking.tour.title}
                  </Link>
                </td>
                <td className="px-2 py-3">{booking.numberOfGuests}</td>
                <td className="px-2 py-3 font-medium">{formatPrice(booking.totalPrice)}</td>
                <td className="px-2 py-3">
                  <Badge variant="outline">{statusLabels[booking.status]}</Badge>
                </td>
                <td className="px-2 py-3">
                  <Badge variant="outline">{paymentLabels[booking.paymentStatus]}</Badge>
                </td>
                <td className="px-2 py-3 text-slate-500">{formatDate(new Date(booking.createdAt))}</td>
                <td className="px-2 py-3">
                  <div className="space-y-2">
                    <AdminBookingActions
                      bookingId={booking.id}
                      status={booking.status}
                      paymentStatus={booking.paymentStatus}
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
  );
}
