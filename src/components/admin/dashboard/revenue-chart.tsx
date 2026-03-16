import { formatPrice } from "@/lib/utils/format";
import { formatCompactNumber } from "@/components/admin/dashboard/formatters";
import type { DashboardTimelineItem } from "@/components/admin/dashboard/types";

type RevenueChartProps = {
  timeline: DashboardTimelineItem[];
  granularity: "day" | "week" | "month";
  startDateLabel: string;
  endDateLabel: string;
};

type ChartPoint = {
  label: string;
  bookings: number;
  confirmedRevenue: number;
};

const granularityLabel: Record<RevenueChartProps["granularity"], string> = {
  day: "ngày",
  week: "tuần",
  month: "tháng",
};

function compactTimeline(timeline: DashboardTimelineItem[]) {
  const maxPoints = 14;
  if (timeline.length <= maxPoints) {
    return timeline.map((item) => ({
      label: item.label,
      bookings: item.bookings,
      confirmedRevenue: item.confirmedRevenue,
    }));
  }

  const chunkSize = Math.ceil(timeline.length / maxPoints);
  const compact: ChartPoint[] = [];

  for (let index = 0; index < timeline.length; index += chunkSize) {
    const chunk = timeline.slice(index, index + chunkSize);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    if (!first || !last) continue;

    compact.push({
      label: first.label === last.label ? first.label : `${first.label} - ${last.label}`,
      bookings: chunk.reduce((sum, item) => sum + item.bookings, 0),
      confirmedRevenue: chunk.reduce((sum, item) => sum + item.confirmedRevenue, 0),
    });
  }

  return compact;
}

function buildLinePath(values: number[], width: number, height: number, padding: number) {
  if (!values.length) return "";

  const max = Math.max(...values, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = values.length === 1 ? 0 : innerWidth / (values.length - 1);

  return values
    .map((value, index) => {
      const x = padding + stepX * index;
      const y = height - padding - (value / max) * innerHeight;
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

function buildPoints(values: number[], width: number, height: number, padding: number) {
  if (!values.length) return [];

  const max = Math.max(...values, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = values.length === 1 ? 0 : innerWidth / (values.length - 1);

  return values.map((value, index) => ({
    x: padding + stepX * index,
    y: height - padding - (value / max) * innerHeight,
    value,
  }));
}

export function RevenueChart({ timeline, granularity, startDateLabel, endDateLabel }: RevenueChartProps) {
  const chartRows = compactTimeline(timeline);

  if (!chartRows.length) {
    return (
      <article className="iv-card rounded-2xl border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-800">Doanh thu và đơn đặt theo thời gian</h2>
        <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu trong khoảng thời gian đã chọn.</p>
      </article>
    );
  }

  const bookingValues = chartRows.map((row) => row.bookings);
  const revenueValues = chartRows.map((row) => row.confirmedRevenue);

  const width = 900;
  const height = 260;
  const padding = 24;

  const bookingPath = buildLinePath(bookingValues, width, height, padding);
  const revenuePath = buildLinePath(revenueValues, width, height, padding);
  const bookingDots = buildPoints(bookingValues, width, height, padding);
  const revenueDots = buildPoints(revenueValues, width, height, padding);

  const totalBookings = bookingValues.reduce((sum, value) => sum + value, 0);
  const totalRevenue = revenueValues.reduce((sum, value) => sum + value, 0);

  const maxBooking = Math.max(...bookingValues, 0);
  const maxRevenue = Math.max(...revenueValues, 0);

  return (
    <article className="iv-card rounded-2xl border-slate-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Doanh thu và đơn đặt theo thời gian</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dữ liệu theo {granularityLabel[granularity]} từ {startDateLabel} đến {endDateLabel}.
          </p>
        </div>
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
          <p className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            Đơn đặt: {formatCompactNumber(totalBookings)}
          </p>
          <p className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Doanh thu: {formatPrice(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#dbe4ee" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#dbe4ee" strokeWidth="1" />

          <path d={bookingPath} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
          <path d={revenuePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />

          {bookingDots.map((dot, index) => (
            <circle key={`b-${chartRows[index]?.label ?? index}`} cx={dot.x} cy={dot.y} r="3.5" fill="#06b6d4">
              <title>{`${chartRows[index]?.label ?? ""}: ${formatCompactNumber(dot.value)} đơn đặt`}</title>
            </circle>
          ))}
          {revenueDots.map((dot, index) => (
            <circle key={`r-${chartRows[index]?.label ?? index}`} cx={dot.x} cy={dot.y} r="3.5" fill="#2563eb">
              <title>{`${chartRows[index]?.label ?? ""}: ${formatPrice(dot.value)}`}</title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Đỉnh đơn đặt</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{formatCompactNumber(maxBooking)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Đỉnh doanh thu</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{formatPrice(maxRevenue)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mẫu dữ liệu</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{formatCompactNumber(chartRows.length)} mốc</p>
        </article>
      </div>
    </article>
  );
}
