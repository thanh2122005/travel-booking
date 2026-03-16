"use client";

import { useMemo, useState } from "react";
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
  x: number;
  y: number;
  value: number;
  label: string;
};

type CompactRow = {
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
  const maxPoints = 16;
  if (timeline.length <= maxPoints) {
    return timeline.map((item) => ({
      label: item.label,
      bookings: item.bookings,
      confirmedRevenue: item.confirmedRevenue,
    }));
  }

  const chunkSize = Math.ceil(timeline.length / maxPoints);
  const compact: CompactRow[] = [];

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

function buildPoints(values: number[], labels: string[], width: number, height: number, padding: number) {
  if (!values.length) return [] as ChartPoint[];

  const max = Math.max(...values, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: padding + stepX * index,
    y: height - padding - (value / max) * innerHeight,
    value,
    label: labels[index] ?? "",
  }));
}

function buildPath(points: ChartPoint[]) {
  if (!points.length) return "";
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function RevenueChart({ timeline, granularity, startDateLabel, endDateLabel }: RevenueChartProps) {
  const [showBookings, setShowBookings] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const rows = useMemo(() => compactTimeline(timeline), [timeline]);

  if (!rows.length) {
    return (
      <article className="iv-card rounded-2xl border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-700">Doanh thu và đơn đặt theo thời gian</h2>
        <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu cho khoảng thời gian này.</p>
      </article>
    );
  }

  const width = 920;
  const height = 290;
  const padding = 28;

  const labels = rows.map((item) => item.label);
  const bookingValues = rows.map((item) => item.bookings);
  const revenueValues = rows.map((item) => item.confirmedRevenue);

  const bookingPoints = buildPoints(bookingValues, labels, width, height, padding);
  const revenuePoints = buildPoints(revenueValues, labels, width, height, padding);

  const bookingPath = buildPath(bookingPoints);
  const revenuePath = buildPath(revenuePoints);

  const totalBookings = bookingValues.reduce((sum, value) => sum + value, 0);
  const totalRevenue = revenueValues.reduce((sum, value) => sum + value, 0);

  const activeIndex = hoveredIndex ?? rows.length - 1;
  const activeRow = rows[activeIndex];
  const activeBookingPoint = bookingPoints[activeIndex];
  const activeRevenuePoint = revenuePoints[activeIndex];
  const anchorPoint = showRevenue ? activeRevenuePoint : activeBookingPoint;

  const tooltipLeft = anchorPoint ? `${clamp((anchorPoint.x / width) * 100, 12, 88)}%` : "50%";
  const tooltipTop = anchorPoint ? `${clamp((anchorPoint.y / height) * 100, 8, 82)}%` : "20%";

  const ticks = [0, Math.floor((rows.length - 1) / 2), rows.length - 1]
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((index) => ({
      index,
      x: bookingPoints[index]?.x ?? padding,
      label: rows[index]?.label ?? "",
    }));

  return (
    <article className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">Doanh thu và đơn đặt theo thời gian</h2>
          <p className="mt-1 text-sm text-slate-500">
            Theo {granularityLabel[granularity]} từ {startDateLabel} đến {endDateLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            aria-pressed={showBookings}
            onClick={() => setShowBookings((prev) => !prev)}
            className={`inline-flex h-8 items-center gap-2 rounded-lg border px-3 transition ${
              showBookings
                ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                : "border-slate-300 bg-white text-slate-500"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            Đơn đặt
          </button>

          <button
            type="button"
            aria-pressed={showRevenue}
            onClick={() => setShowRevenue((prev) => !prev)}
            className={`inline-flex h-8 items-center gap-2 rounded-lg border px-3 transition ${
              showRevenue
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-500"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Doanh thu
          </button>
        </div>
      </div>

      {!showBookings && !showRevenue ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <p className="text-sm text-slate-500">Bạn đang ẩn cả hai chuỗi dữ liệu.</p>
          <button
            type="button"
            onClick={() => {
              setShowBookings(true);
              setShowRevenue(true);
            }}
            className="mt-3 inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Hiện lại biểu đồ
          </button>
        </div>
      ) : (
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2" onMouseLeave={() => setHoveredIndex(null)}>
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[250px] w-full">
            {Array.from({ length: 4 }).map((_, index) => {
              const y = padding + ((height - padding * 2) / 3) * index;
              return <line key={index} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
            })}

            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />

            {showBookings ? <path d={bookingPath} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" /> : null}
            {showRevenue ? <path d={revenuePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" /> : null}

            {showBookings
              ? bookingPoints.map((point, index) => (
                  <circle
                    key={`booking-${point.label}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={hoveredIndex === index ? 5 : 3.5}
                    fill="#06b6d4"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                  />
                ))
              : null}

            {showRevenue
              ? revenuePoints.map((point, index) => (
                  <circle
                    key={`revenue-${point.label}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={hoveredIndex === index ? 5 : 3.5}
                    fill="#2563eb"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                  />
                ))
              : null}

            {ticks.map((tick) => (
              <text key={tick.index} x={tick.x} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748b">
                {tick.label}
              </text>
            ))}
          </svg>

          {activeRow ? (
            <div
              className="pointer-events-none absolute z-10 min-w-48 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
              style={{ left: tooltipLeft, top: tooltipTop }}
            >
              <p className="font-medium text-slate-600">{activeRow.label}</p>
              <p className="mt-1 text-cyan-700">Đơn đặt: {formatCompactNumber(activeRow.bookings)}</p>
              <p className="mt-0.5 text-blue-700">Doanh thu: {formatPrice(activeRow.confirmedRevenue)}</p>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Tổng đơn</p>
          <p className="mt-1 text-2xl font-semibold text-slate-700">{formatCompactNumber(totalBookings)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Tổng doanh thu</p>
          <p className="mt-1 text-2xl font-semibold text-slate-700">{formatPrice(totalRevenue)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Mốc dữ liệu</p>
          <p className="mt-1 text-2xl font-semibold text-slate-700">{formatCompactNumber(rows.length)}</p>
        </article>
      </div>
    </article>
  );
}
