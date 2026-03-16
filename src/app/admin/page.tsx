import Link from "next/link";
import {
  BookOpen,
  CircleDollarSign,
  FileDown,
  Handshake,
  MessageSquareMore,
  ShoppingBag,
  Users,
} from "lucide-react";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { EmptyState } from "@/components/common/empty-state";
import { DashboardHeader } from "@/components/admin/dashboard/dashboard-header";
import { StatsCards } from "@/components/admin/dashboard/stats-cards";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { TopToursTable } from "@/components/admin/dashboard/top-tours-table";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import { LatestReviews } from "@/components/admin/dashboard/latest-reviews";
import { NewConsultations } from "@/components/admin/dashboard/new-consultations";
import { NewSubscribers } from "@/components/admin/dashboard/new-subscribers";
import { StatusSummary } from "@/components/admin/dashboard/status-summary";
import type {
  DashboardRecentBooking,
  DashboardRecentInquiry,
  DashboardRecentReview,
  DashboardSubscriber,
  DashboardTopTourItem,
} from "@/components/admin/dashboard/types";
import { adminLabels, getAdminDashboardData } from "@/lib/db/admin-queries";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type TimelineGranularity = "day" | "week" | "month";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const rangeOptions = [
  { label: "7 ngày", value: 7 },
  { label: "30 ngày", value: 30 },
  { label: "3 tháng", value: 90 },
  { label: "12 tháng", value: 365 },
] as const;

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseRangeDays(value: string) {
  const number = Number(value || "30");
  if (!Number.isFinite(number)) return 30;
  const valid = rangeOptions.some((option) => option.value === number);
  return valid ? number : 30;
}

function parseGranularity(value: string): TimelineGranularity | undefined {
  if (value === "day" || value === "week" || value === "month") {
    return value;
  }
  return undefined;
}

function toInputDateValue(date: Date) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrencyDelta(value: number) {
  const sign = value >= 0 ? "+" : "-";
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} tỷ`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(0)} triệu`;
  return `${sign}${new Intl.NumberFormat("vi-VN").format(Math.round(abs))} đ`;
}

function buildQuery(
  currentParams: Record<string, string | string[] | undefined>,
  patch: Record<string, string>,
) {
  const nextQuery: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(currentParams)) {
    const value = normalizeParam(rawValue);
    if (value) {
      nextQuery[key] = value;
    }
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value) {
      nextQuery[key] = value;
      continue;
    }
    delete nextQuery[key];
  }

  return nextQuery;
}

function buildDeltaText(current: number, previous: number, type: "number" | "currency" | "rate") {
  const diff = current - previous;
  if (diff === 0) {
    return { tone: "flat" as const, text: "Không đổi" };
  }

  if (type === "number") {
    return {
      tone: diff > 0 ? ("up" as const) : ("down" as const),
      text: `${diff > 0 ? "+" : ""}${Math.round(diff)} đơn`,
    };
  }

  if (type === "currency") {
    return {
      tone: diff > 0 ? ("up" as const) : ("down" as const),
      text: formatCurrencyDelta(diff),
    };
  }

  return {
    tone: diff > 0 ? ("up" as const) : ("down" as const),
    text: `${diff > 0 ? "+" : ""}${(diff * 100).toFixed(1)} đ.%`,
  };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;

  const rangeDays = parseRangeDays(normalizeParam(params.rangeDays));
  const granularity = parseGranularity(normalizeParam(params.granularity));
  const startDate = normalizeParam(params.startDate);
  const endDate = normalizeParam(params.endDate);

  const hasCustomDateRange = Boolean(startDate || endDate);
  const hasTimelineFilterOverrides = hasCustomDateRange || rangeDays !== 30 || Boolean(granularity);

  const exportQuery = {
    ...(hasCustomDateRange
      ? {
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        }
      : {
          rangeDays: String(rangeDays),
        }),
    ...(granularity ? { granularity } : {}),
  };

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
    return (
      <EmptyState
        title="Không thể tải dữ liệu quản trị"
        description="Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
        ctaHref="/admin"
        ctaLabel="Thử lại"
      />
    );
  }

  const orderDelta = buildDeltaText(data.timeRangeStats.bookings, data.previousTimeRangeStats.bookings, "number");
  const revenueDelta = buildDeltaText(
    data.timeRangeStats.confirmedRevenue,
    data.previousTimeRangeStats.confirmedRevenue,
    "currency",
  );
  const confirmationDelta = buildDeltaText(
    data.timeRangeStats.confirmationRate,
    data.previousTimeRangeStats.confirmationRate,
    "rate",
  );
  const paymentDelta = buildDeltaText(
    data.timeRangeStats.paymentRate,
    data.previousTimeRangeStats.paymentRate,
    "rate",
  );

  const statsCards = [
    {
      key: "revenue",
      label: "Doanh thu",
      value: formatPrice(data.timeRangeStats.confirmedRevenue),
      deltaText: revenueDelta.text,
      deltaTone: revenueDelta.tone,
      icon: CircleDollarSign,
    },
    {
      key: "bookings",
      label: "Đơn trong kỳ",
      value: data.timeRangeStats.bookings.toString(),
      deltaText: orderDelta.text,
      deltaTone: orderDelta.tone,
      icon: ShoppingBag,
    },
    {
      key: "confirmation-rate",
      label: "Tỷ lệ xác nhận",
      value: formatRate(data.timeRangeStats.confirmationRate),
      deltaText: confirmationDelta.text,
      deltaTone: confirmationDelta.tone,
      icon: Handshake,
    },
    {
      key: "payment-rate",
      label: "Tỷ lệ thanh toán",
      value: formatRate(data.timeRangeStats.paymentRate),
      deltaText: paymentDelta.text,
      deltaTone: paymentDelta.tone,
      icon: BookOpen,
    },
    {
      key: "users",
      label: "Người dùng",
      value: data.metrics.totalUsers.toString(),
      hint: `${data.metrics.totalTours} tour đang quản lý`,
      icon: Users,
    },
    {
      key: "leads",
      label: "Leads mới",
      value: data.metrics.totalInquiries.toString(),
      hint: `${data.metrics.totalNewsletter} email nhận tin`,
      icon: MessageSquareMore,
    },
  ] as const;

  const periodLabel = `${formatDate(data.timelineStartDate)} - ${formatDate(data.timelineEndDate)}`;

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <DashboardHeader
        periodLabel={periodLabel}
        quickStats={[
          { label: "Đơn trong kỳ", value: data.timeRangeStats.bookings.toString() },
          { label: "Doanh thu kỳ", value: formatPrice(data.timeRangeStats.confirmedRevenue) },
          { label: "Chờ xử lý", value: data.bookingsByStatus.PENDING.toString() },
        ]}
        actions={
          <>
            <Link
              href="/admin/bookings"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Quản lý đơn
            </Link>
            <Link
              href={{
                pathname: "/api/admin/dashboard/export",
                query: exportQuery,
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
            >
              <FileDown className="h-4 w-4" />
              Xuất CSV
            </Link>
          </>
        }
      />

      <section id="bo-loc-thoi-gian" className="iv-card scroll-mt-24 rounded-2xl border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {rangeOptions.map((option) => {
            const active = !hasCustomDateRange && rangeDays === option.value;
            return (
              <Link
                key={option.value}
                href={{
                  pathname: "/admin",
                  query: buildQuery(params, {
                    rangeDays: String(option.value),
                    startDate: "",
                    endDate: "",
                  }),
                }}
                className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold transition ${
                  active
                    ? "border-cyan-600 bg-cyan-600 text-white"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </Link>
            );
          })}

          {hasTimelineFilterOverrides ? (
            <Link
              href="/admin"
              className="ml-auto inline-flex h-8 items-center rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Đặt lại
            </Link>
          ) : null}
        </div>

        <form className="mt-3 grid gap-2 md:grid-cols-[130px_170px_170px_auto]">
          <input type="hidden" name="rangeDays" value={String(rangeDays)} />
          <select
            name="granularity"
            defaultValue={data.timelineGranularity}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-cyan-500 focus:outline-none"
          >
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
          <input
            type="date"
            name="startDate"
            defaultValue={startDate || toInputDateValue(data.timelineStartDate)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="date"
            name="endDate"
            defaultValue={endDate || toInputDateValue(data.timelineEndDate)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-cyan-500 focus:outline-none"
          />
          <button type="submit" className="iv-btn-primary inline-flex h-10 items-center justify-center px-4 text-sm font-medium">
            Áp dụng
          </button>
        </form>
      </section>

      <StatsCards items={[...statsCards]} />

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <RevenueChart
          timeline={data.bookingRevenueTimeline}
          granularity={data.timelineGranularity}
          startDateLabel={formatDate(data.timelineStartDate)}
          endDateLabel={formatDate(data.timelineEndDate)}
        />

        <StatusSummary
          bookingCounts={data.bookingsByStatus}
          paymentCounts={data.paymentsByStatus}
          bookingLabels={adminLabels.bookingStatus}
          paymentLabels={adminLabels.paymentStatus}
        />
      </section>

      <TopToursTable items={data.topRevenueTours as DashboardTopTourItem[]} />

      <section id="du-lieu-moi" className="grid scroll-mt-24 gap-4 xl:grid-cols-2">
        <RecentOrders
          items={data.recentBookings as DashboardRecentBooking[]}
          bookingStatusLabels={adminLabels.bookingStatus}
          paymentStatusLabels={adminLabels.paymentStatus}
        />
        <LatestReviews items={data.recentReviews as DashboardRecentReview[]} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <NewConsultations items={data.recentInquiries as DashboardRecentInquiry[]} />
        <NewSubscribers items={data.recentNewsletterSubscribers as DashboardSubscriber[]} />
      </section>

      <MobileQuickActions
        items={[
          { href: "#bo-loc-thoi-gian", label: "Bộ lọc" },
          { href: "#du-lieu-moi", label: "Dữ liệu mới", active: true },
          { href: "/admin/bookings", label: "Đơn đặt" },
        ]}
      />
    </div>
  );
}


