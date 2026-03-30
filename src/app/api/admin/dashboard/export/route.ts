import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { getAdminDashboardData } from "@/lib/db/admin-queries";
import { toCsv } from "@/lib/utils/csv";

type TimelineGranularity = "day" | "week" | "month";

const rangeOptions = [30, 90, 180, 365] as const;
export const runtime = "nodejs";

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

function formatRatePointDelta(value: number) {
  return `${Math.abs(value * 100).toFixed(1)} điểm %`;
}

function formatSigned(value: number, formatter: (input: number) => string) {
  if (value === 0) return formatter(0);
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatter(Math.abs(value))}`;
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

function toUtf16LePayload(text: string) {
  const bom = Buffer.from([0xff, 0xfe]);
  const body = Buffer.from(text, "utf16le");
  return Buffer.concat([bom, body]);
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

  let data: Awaited<ReturnType<typeof getAdminDashboardData>> | null = null;
  try {
    data = await getAdminDashboardData({
      ...(hasCustomDateRange
        ? { startDate: startDate || undefined, endDate: endDate || undefined }
        : { rangeDays }),
      ...(granularity ? { granularity } : {}),
    });
  } catch {
    return NextResponse.json({ message: "Không thể xuất báo cáo doanh thu lúc này." }, { status: 500 });
  }

  const rows: Array<Array<unknown>> = [];
  const setCell = (row: number, col: number, value: unknown) => {
    while (rows.length <= row) rows.push([]);
    rows[row]![col] = value;
  };

  const leftCol = 0;
  const compareCol = 5;
  const topTourCol = 11;
  const timelineCol = 18;

  setCell(0, leftCol, "BÁO CÁO DASHBOARD DOANH THU");
  setCell(1, leftCol, "Xuất lúc");
  setCell(1, leftCol + 1, formatDate(new Date()));
  setCell(2, leftCol, "Khoảng thời gian");
  setCell(2, leftCol + 1, `${formatDate(data.timelineStartDate)} - ${formatDate(data.timelineEndDate)}`);
  setCell(3, leftCol, "Kỳ so sánh");
  setCell(
    3,
    leftCol + 1,
    `${formatDate(data.previousTimelineStartDate)} - ${formatDate(data.previousTimelineEndDate)}`,
  );
  setCell(4, leftCol, "Độ chi tiết");
  setCell(4, leftCol + 1, getGranularityLabel(data.timelineGranularity));

  setCell(6, leftCol, "KPI TRONG KỲ");
  setCell(7, leftCol, "Chỉ số");
  setCell(7, leftCol + 1, "Giá trị");
  setCell(8, leftCol, "Đơn trong kỳ");
  setCell(8, leftCol + 1, data.timeRangeStats.bookings);
  setCell(9, leftCol, "Đơn xác nhận");
  setCell(9, leftCol + 1, data.timeRangeStats.confirmedBookings);
  setCell(10, leftCol, "Đơn thanh toán");
  setCell(10, leftCol + 1, data.timeRangeStats.paidBookings);
  setCell(11, leftCol, "Doanh thu xác nhận");
  setCell(11, leftCol + 1, formatPrice(data.timeRangeStats.confirmedRevenue));
  setCell(12, leftCol, "Tỷ lệ xác nhận");
  setCell(12, leftCol + 1, formatRate(data.timeRangeStats.confirmationRate));
  setCell(13, leftCol, "Tỷ lệ thanh toán");
  setCell(13, leftCol + 1, formatRate(data.timeRangeStats.paymentRate));
  setCell(14, leftCol, "Giá trị đơn TB");
  setCell(14, leftCol + 1, formatPrice(data.timeRangeStats.averageConfirmedOrderValue));

  setCell(0, compareCol, "SO SÁNH VỚI KỲ TRƯỚC");
  setCell(1, compareCol, "Chỉ số");
  setCell(1, compareCol + 1, "Hiện tại");
  setCell(1, compareCol + 2, "Kỳ trước");
  setCell(1, compareCol + 3, "Chênh lệch");
  setCell(2, compareCol, "Đơn trong kỳ");
  setCell(2, compareCol + 1, data.timeRangeStats.bookings);
  setCell(2, compareCol + 2, data.previousTimeRangeStats.bookings);
  setCell(
    2,
    compareCol + 3,
    formatSigned(
      data.timeRangeStats.bookings - data.previousTimeRangeStats.bookings,
      (input) => input.toString(),
    ),
  );
  setCell(3, compareCol, "Doanh thu xác nhận");
  setCell(3, compareCol + 1, formatPrice(data.timeRangeStats.confirmedRevenue));
  setCell(3, compareCol + 2, formatPrice(data.previousTimeRangeStats.confirmedRevenue));
  setCell(
    3,
    compareCol + 3,
    formatSigned(
      data.timeRangeStats.confirmedRevenue - data.previousTimeRangeStats.confirmedRevenue,
      formatPrice,
    ),
  );
  setCell(4, compareCol, "Tỷ lệ xác nhận");
  setCell(4, compareCol + 1, formatRate(data.timeRangeStats.confirmationRate));
  setCell(4, compareCol + 2, formatRate(data.previousTimeRangeStats.confirmationRate));
  setCell(
    4,
    compareCol + 3,
    formatSigned(
      data.timeRangeStats.confirmationRate - data.previousTimeRangeStats.confirmationRate,
      formatRatePointDelta,
    ),
  );
  setCell(5, compareCol, "Tỷ lệ thanh toán");
  setCell(5, compareCol + 1, formatRate(data.timeRangeStats.paymentRate));
  setCell(5, compareCol + 2, formatRate(data.previousTimeRangeStats.paymentRate));
  setCell(
    5,
    compareCol + 3,
    formatSigned(
      data.timeRangeStats.paymentRate - data.previousTimeRangeStats.paymentRate,
      formatRatePointDelta,
    ),
  );

  setCell(0, topTourCol, "TOP TOUR THEO DOANH THU XÁC NHẬN");
  setCell(1, topTourCol, "#");
  setCell(1, topTourCol + 1, "Tour");
  setCell(1, topTourCol + 2, "Đơn trong kỳ");
  setCell(1, topTourCol + 3, "Đơn xác nhận");
  setCell(1, topTourCol + 4, "Đã thanh toán");
  setCell(1, topTourCol + 5, "Doanh thu xác nhận");
  for (const [index, tour] of data.topRevenueTours.entries()) {
    const row = 2 + index;
    setCell(row, topTourCol, index + 1);
    setCell(row, topTourCol + 1, tour.title);
    setCell(row, topTourCol + 2, tour.bookings);
    setCell(row, topTourCol + 3, tour.confirmedBookings);
    setCell(row, topTourCol + 4, tour.paidBookings);
    setCell(row, topTourCol + 5, formatPrice(tour.confirmedRevenue));
  }

  setCell(0, timelineCol, "DIỄN BIẾN THEO MỐC THỜI GIAN");
  setCell(1, timelineCol, "Mốc thời gian");
  setCell(1, timelineCol + 1, "Số đơn");
  setCell(1, timelineCol + 2, "Doanh thu xác nhận");
  for (const [index, item] of data.bookingRevenueTimeline.entries()) {
    const row = 2 + index;
    setCell(row, timelineCol, item.label);
    setCell(row, timelineCol + 1, item.bookings);
    setCell(row, timelineCol + 2, formatPrice(item.confirmedRevenue));
  }

  const tsvText = toCsv(rows, "\t");
  const tsvPayload = toUtf16LePayload(tsvText);

  return new NextResponse(new Uint8Array(tsvPayload), {
    status: 200,
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-16le",
      "Content-Disposition": `attachment; filename="${buildFileName("dashboard_revenue_admin")}"`,
      "Cache-Control": "no-store",
    },
  });
}
