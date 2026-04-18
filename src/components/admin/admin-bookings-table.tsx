"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminBookingDetailDialog } from "@/components/admin/admin-booking-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { resolveBookingGuestBreakdown } from "@/lib/utils/booking-breakdown";
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

function getBookingGuestBreakdown(booking: BookingItem) {
  const unitPrice = booking.tour.discountPrice ?? booking.tour.price;
  return resolveBookingGuestBreakdown({
    numberOfGuests: booking.numberOfGuests,
    totalPrice: booking.totalPrice,
    unitPrice,
    guestsFrom8: booking.guestsFrom8,
    child5To7Guests: booking.child5To7Guests,
    childUnder5Guests: booking.childUnder5Guests,
  });
}

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

/**
 * Component table booking trong admin:
 * - Có 2 chế độ hiển thị: mobile (card) và desktop (table).
 * - Hỗ trợ bulk action trên scope "trang hiện tại".
 * - Sau mỗi action thành công sẽ refresh route để đồng bộ data server.
 */
export function AdminBookingsTable({ items, statusLabels, paymentLabels }: AdminBookingsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPaymentStatus, setBulkPaymentStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  // Selection strategy:
  // - selectedIds giữ trạng thái tổng.
  // - selectedIdsInPage chỉ là phần selection thuộc page đang xem.
  // Cách này giúp bulk action "an toàn theo trang".
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  // Chỉ giữ selection đang nằm trong trang hiện tại để tránh thao tác nhầm.
  const selectedIdsInPage = useMemo(
    () => selectedIds.filter((id) => itemIds.includes(id)),
    [itemIds, selectedIds],
  );
  const isAllSelected = itemIds.length > 0 && selectedIdsInPage.length === itemIds.length;

  function toggleSelectAll(checked: boolean) {
    // checked=true: thêm tất cả id page hiện tại vào selection.
    // checked=false: chỉ xóa id của page hiện tại, không ảnh hưởng page khác.
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...itemIds]));
      return prev.filter((id) => !itemIds.includes(id));
    });
  }

  function toggleItem(id: string, checked: boolean) {
    // Toggle row-level selection.
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  }

  function handleBulkUpdate() {
    // Validate trước khi gọi API để giảm request lỗi không cần thiết.
    if (!selectedIdsInPage.length) {
      toast.error("Vui lòng chọn ít nhất một đơn để cập nhật.");
      return;
    }

    if (!bulkStatus && !bulkPaymentStatus) {
      toast.error("Vui lòng chọn ít nhất một trường cần cập nhật hàng loạt.");
      return;
    }

    startTransition(async () => {
      try {
        // Bulk update status/paymentStatus cho các dòng đang chọn.
        const response = await fetch("/api/admin/bookings/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: selectedIdsInPage,
            ...(bulkStatus ? { status: bulkStatus } : {}),
            ...(bulkPaymentStatus ? { paymentStatus: bulkPaymentStatus } : {}),
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
          toast.error(payload.message ?? "Không thể cập nhật đơn hàng loạt.");
          return;
        }

        setSelectedIds([]);
        setBulkStatus("");
        setBulkPaymentStatus("");
        toast.success(payload.message ?? "Đã cập nhật đơn hàng loạt.");
        router.refresh();
      } catch {
        toast.error("Kết nối tạm thời gián đoạn. Vui lòng thử lại.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="iv-admin-bulk-card">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-[220px] flex-1">
              <p className="iv-admin-bulk-heading">Cập nhật hàng loạt</p>
              <p className="iv-admin-bulk-meta">
                Đã chọn <span className="font-semibold text-slate-800">{selectedIdsInPage.length}</span> đơn trong trang hiện tại.
              </p>
            </div>
            {selectedIdsInPage.length ? (
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Bỏ chọn trong trang
              </button>
            ) : null}
          </div>

          <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-5">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:col-span-2 xl:col-span-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => toggleSelectAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              Chọn tất cả trong trang
            </label>
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
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
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
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
              className="iv-btn-primary inline-flex h-10 w-full items-center justify-center px-5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2 xl:col-span-1"
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
      </div>

      <div className="space-y-3 xl:hidden">
        {/* Mobile: render theo card de de doc, thao tac nhanh tren man hinh hep. */}
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
                  {(() => {
                    const breakdown = getBookingGuestBreakdown(booking);
                    const roomTypeLabel = booking.roomType === "SINGLE" ? "Phòng đơn" : "Phòng đôi";
                    return (
                      <div className="space-y-0.5 text-xs text-slate-500">
                        <p>
                          {booking.numberOfGuests} khách (NL: {breakdown.adults}, TE 5-7: {breakdown.child5To7}, dưới 5: {breakdown.childUnder5})
                        </p>
                        <p>{roomTypeLabel}</p>
                      </div>
                    );
                  })()}
                </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">{booking.fullName}</p>
                  <p className="text-xs text-slate-500">{booking.email}</p>
                </div>

                <p className="text-sm text-slate-700">
                  Tour{" "}
                  <Link href={`/tours/${booking.tour.slug}`} className="font-semibold text-teal-700 hover:text-teal-800">
                    {booking.tour.title}
                  </Link>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{statusLabels[booking.status]}</Badge>
                  <Badge variant="outline">{paymentLabels[booking.paymentStatus]}</Badge>
                </div>

                <div className="pt-2">
                  <AdminBookingDetailDialog booking={booking} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-[1.25rem] border border-slate-200/60 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.06)] xl:block">
        {/* Desktop: render table de theo doi nhieu cot cung luc. */}
        <div className="p-4 pb-2">
          <table className="w-full text-sm">
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
                <th className="px-2 py-3 font-medium whitespace-nowrap">Đơn đặt</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Tour</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Giá trị</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap">Cập nhật</th>
                <th className="px-2 py-3 font-medium whitespace-nowrap text-right">Thao tác</th>
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
                  <td className="min-w-[170px] px-2 py-3">
                    <p className="font-semibold text-slate-800">{booking.bookingCode}</p>
                    <p className="mt-1 font-medium text-slate-800">{booking.fullName}</p>
                    <p className="text-xs text-slate-500">{booking.email}</p>
                  </td>
                  <td className="min-w-[180px] px-2 py-3">
                    <Link href={`/tours/${booking.tour.slug}`} className="line-clamp-2 font-medium text-teal-700 hover:text-teal-800">
                      {booking.tour.title}
                    </Link>
                    {(() => {
                      const breakdown = getBookingGuestBreakdown(booking);
                      return (
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.numberOfGuests} khách (NL: {breakdown.adults}, TE 5-7: {breakdown.child5To7}, dưới 5: {breakdown.childUnder5})
                        </p>
                      );
                    })()}
                  </td>
                  <td className="min-w-[150px] px-2 py-3">
                    <p className="font-medium text-slate-800">{formatPrice(booking.totalPrice)}</p>
                    {(() => {
                      const breakdown = getBookingGuestBreakdown(booking);
                      const unitPrice = booking.unitPriceSnapshot ?? booking.tour.discountPrice ?? booking.tour.price;
                      const child5To7Ratio = booking.child5To7RatioSnapshot ?? 0.5;
                      const childUnder5Ratio = booking.childUnder5RatioSnapshot ?? 0;
                      const adultTotal = breakdown.adults * unitPrice;
                      const child5To7Total = Math.round(breakdown.child5To7 * unitPrice * child5To7Ratio);
                      const childUnder5Total = Math.round(breakdown.childUnder5 * unitPrice * childUnder5Ratio);
                      const roomSurchargeTotal = booking.roomSurchargeTotal ?? 0;
                      const roomTypeLabel = booking.roomType === "SINGLE" ? "Phòng đơn" : "Phòng đôi";
                      return (
                        <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                          <p>NL: {formatPrice(adultTotal)} • TE 5-7: {formatPrice(child5To7Total)} • dưới 5: {formatPrice(childUnder5Total)}</p>
                          <p>{roomTypeLabel}{roomSurchargeTotal > 0 ? ` • Phụ thu: ${formatPrice(roomSurchargeTotal)}` : ""}</p>
                        </div>
                      );
                    })()}
                    <p className="mt-1 text-xs text-slate-500">{booking.paymentMethod || "Thanh toán tiêu chuẩn"}</p>
                  </td>
                  <td className="min-w-[150px] px-2 py-3">
                    <div className="space-y-2">
                      <Badge variant="outline">{statusLabels[booking.status]}</Badge>
                      <div>
                        <Badge variant="outline">{paymentLabels[booking.paymentStatus]}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(new Date(booking.createdAt))}</p>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end">
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


