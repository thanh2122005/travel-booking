import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { getAdminDashboardData } from "@/lib/db/admin-queries";

type TimelineGranularity = "day" | "week" | "month";

const rangeOptions = [30, 90, 180, 365] as const;

function normalizeParam(value: string | null) {
  return value?.trim() ?? "";
}

function parseRangeDays(value: string) {
  const number = Number(value || "180");
  if (!Number.isFinite(number)) return 180;
  return rangeOptions.includes(number as (typeof rangeOptions)[number]) ? number : 180;
}

function parseGranularity(value: string): TimelineGranularity | undefined {
  if (value === "day" || value === "week" || value === "month") {
    return value;
  }
  return undefined;
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

function toCsv(rows: Array<Array<unknown>>) {
  return rows.map((row) => row.map((value) => escapeCsvCell(value)).join(",")).join("\n");
}

function buildFileName(prefix: string) {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `${prefix}_${date}_${time}.csv`;
}

function getGranularityLabel(value: TimelineGranularity) {
  if (value === "day") return "Theo ngày";
  if (value === "week") return "Theo tuần";
  return "Theo tháng";
}

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const params = request.nextUrl.searchParams;
  const rangeDays = parseRangeDays(normalizeParam(params.get("rangeDays")));
  const granularity = parseGranularity(normalizeParam(params.get("granularity")));
  const startDate = normalizeParam(params.get("startDate"));
  const endDate = normalizeParam(params.get("endDate"));

  const hasCustomDateRange = Boolean(startDate || endDate);

  const data = await getAdminDashboardData({
    ...(hasCustomDateRange
      ? {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }
      : {
          rangeDays,
        }),
    ...(granularity ? { granularity } : {}),
  }).catch(() => null);

  if (!data) {
    return NextResponse.json(
      { message: "Không thể xuất báo cáo doanh thu lúc này." },
      { status: 500 },
    );
  }

  const rows: Array<Array<unknown>> = [
    ["BÁO CÁO DASHBOARD DOANH THU"],
    [
      "Khoảng thời gian",
      `${formatDate(data.timelineStartDate)} - ${formatDate(data.timelineEndDate)}`,
    ],
    ["Độ chi tiết", getGranularityLabel(data.timelineGranularity)],
    [],
    ["KPI TRONG KỲ", "Giá trị"],
    ["Đơn trong kỳ", data.timeRangeStats.bookings],
    ["Đơn xác nhận", data.timeRangeStats.confirmedBookings],
    ["Đơn thanh toán", data.timeRangeStats.paidBookings],
    ["Doanh thu xác nhận", formatPrice(data.timeRangeStats.confirmedRevenue)],
    ["Tỷ lệ xác nhận", formatRate(data.timeRangeStats.confirmationRate)],
    ["Tỷ lệ thanh toán", formatRate(data.timeRangeStats.paymentRate)],
    [
      "Giá trị đơn xác nhận trung bình",
      formatPrice(data.timeRangeStats.averageConfirmedOrderValue),
    ],
    [],
    ["DIỄN BIẾN THEO MỐC THỜI GIAN"],
    ["Mốc thời gian", "Số đơn", "Doanh thu xác nhận"],
    ...data.bookingRevenueTimeline.map((item) => [item.label, item.bookings, item.confirmedRevenue]),
    [],
    ["TOP TOUR THEO DOANH THU XÁC NHẬN"],
    ["#","Tour", "Đơn trong kỳ", "Đơn xác nhận", "Đã thanh toán", "Doanh thu xác nhận"],
    ...data.topRevenueTours.map((tour, index) => [
      index + 1,
      tour.title,
      tour.bookings,
      tour.confirmedBookings,
      tour.paidBookings,
      tour.confirmedRevenue,
    ]),
  ];

  const csv = `\uFEFF${toCsv(rows)}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFileName("dashboard_revenue_admin")}"`,
      "Cache-Control": "no-store",
    },
  });
}
