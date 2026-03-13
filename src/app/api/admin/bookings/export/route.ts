import { BookingStatus, PaymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { adminLabels, exportAdminBookings } from "@/lib/db/admin-queries";
import { toCsv } from "@/lib/utils/csv";

const bookingStatusValues: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
];
const paymentStatusValues: PaymentStatus[] = [PaymentStatus.UNPAID, PaymentStatus.PAID];

function normalizeParam(value: string | null) {
  return value?.trim() ?? "";
}

function parseDateAtBoundary(value: string, boundary: "start" | "end") {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  if (boundary === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildFileName(prefix: string) {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `${prefix}_${date}_${time}.csv`;
}

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const search = normalizeParam(request.nextUrl.searchParams.get("search"));
  const statusRaw = normalizeParam(request.nextUrl.searchParams.get("status"));
  const paymentStatusRaw = normalizeParam(request.nextUrl.searchParams.get("paymentStatus"));
  const createdFromRaw = normalizeParam(request.nextUrl.searchParams.get("createdFrom"));
  const createdToRaw = normalizeParam(request.nextUrl.searchParams.get("createdTo"));

  const status = bookingStatusValues.includes(statusRaw as BookingStatus)
    ? (statusRaw as BookingStatus)
    : undefined;
  const paymentStatus = paymentStatusValues.includes(paymentStatusRaw as PaymentStatus)
    ? (paymentStatusRaw as PaymentStatus)
    : undefined;

  const items = await exportAdminBookings({
    search: search || undefined,
    status,
    paymentStatus,
    createdFrom: parseDateAtBoundary(createdFromRaw, "start"),
    createdTo: parseDateAtBoundary(createdToRaw, "end"),
  }).catch(() => null);

  if (!items) {
    return NextResponse.json({ message: "Không thể xuất dữ liệu booking lúc này." }, { status: 500 });
  }

  const rows: Array<Array<unknown>> = [
    [
      "Mã đơn",
      "Ngày tạo",
      "Khách hàng",
      "Email",
      "Số điện thoại",
      "Tour",
      "Trạng thái đơn",
      "Trạng thái thanh toán",
      "Số khách",
      "Tổng tiền (VND)",
      "Ngày khởi hành",
      "Ghi chú",
    ],
    ...items.map((item) => [
      item.bookingCode,
      formatDateTime(item.createdAt),
      item.fullName,
      item.email,
      item.phone,
      item.tour.title,
      adminLabels.bookingStatus[item.status],
      adminLabels.paymentStatus[item.paymentStatus],
      item.numberOfGuests,
      item.totalPrice,
      formatDateTime(item.departureDate ?? null),
      item.note ?? "",
    ]),
  ];

  const csv = `\uFEFF${toCsv(rows)}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFileName("booking_admin")}"`,
      "Cache-Control": "no-store",
    },
  });
}
