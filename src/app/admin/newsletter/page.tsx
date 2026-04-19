import Link from "next/link";
import { AdminNewsletterTable } from "@/components/admin/admin-newsletter-table";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { getAdminNewsletterSubscribers } from "@/lib/db/admin-engagement-queries";

export const dynamic = "force-dynamic";

type AdminNewsletterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const quickDateRanges = [30, 90, 180] as const;

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
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

function toValidPage(value: string) {
  const page = Number(value || "1");
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.trunc(page);
}

function toInputDateValue(date: Date) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function createQuickDateRange(days: number) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  return {
    createdFrom: toInputDateValue(start),
    createdTo: toInputDateValue(end),
  };
}

function formatInputDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function buildDateRangeLabel(createdFrom: string, createdTo: string) {
  if (createdFrom && createdTo) {
    return `Ngày đăng ký: ${formatInputDate(createdFrom)} - ${formatInputDate(createdTo)}`;
  }
  if (createdFrom) {
    return `Đăng ký từ ngày: ${formatInputDate(createdFrom)}`;
  }
  if (createdTo) {
    return `Đăng ký đến ngày: ${formatInputDate(createdTo)}`;
  }
  return "";
}

export default async function AdminNewsletterPage({ searchParams }: AdminNewsletterPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const createdDate = normalizeParam(params.createdDate);
  const createdFrom = normalizeParam(params.createdFrom);
  const createdTo = normalizeParam(params.createdTo);
  const page = toValidPage(normalizeParam(params.page));
  const normalizedCreatedFrom = createdDate || createdFrom;
  const normalizedCreatedTo = createdDate || createdTo;

  const hasActiveFilters = Boolean(search || normalizedCreatedFrom || normalizedCreatedTo);
  const exportQuery = {
    ...(search ? { search } : {}),
    ...(normalizedCreatedFrom ? { createdFrom: normalizedCreatedFrom } : {}),
    ...(normalizedCreatedTo ? { createdTo: normalizedCreatedTo } : {}),
  };
  const dateRangeLabel = buildDateRangeLabel(normalizedCreatedFrom, normalizedCreatedTo);
  const activeFilterLabels = [
    ...(search ? [`Từ khóa: ${search}`] : []),
    ...(dateRangeLabel ? [dateRangeLabel] : []),
  ];

  let data: Awaited<ReturnType<typeof getAdminNewsletterSubscribers>> | null = null;
  let loadFailed = false;

  try {
    data = await getAdminNewsletterSubscribers({
    search: search || undefined,
    createdFrom: parseDateAtBoundary(normalizedCreatedFrom, "start"),
    createdTo: parseDateAtBoundary(normalizedCreatedTo, "end"),
    page,
    pageSize: 15,
  });
  } catch {
    loadFailed = true;
  }

  if (!data) {
    return (
      <EmptyState
        title={loadFailed ? "Không thể tải danh sách nhận tin" : "Dữ liệu nhận tin chưa sẵn sàng"}
        description={loadFailed ? "Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại." : "Hiện chưa có dữ liệu để hiển thị trên trang này."}
        ctaHref="/admin/newsletter"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="iv-card p-5">
        <h1 className="iv-admin-page-title">Đăng ký nhận tin</h1>
        <p className="iv-admin-page-subtitle">
          Theo dõi danh sách email đã đăng ký nhận bản tin khuyến mãi.
        </p>
      </div>

      <form id="bo-loc-nhan-tin" className="iv-admin-filter-form">
        <input type="hidden" name="page" value="1" />
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="search" className="iv-admin-filter-title mb-0">
            Tìm kiếm email
          </label>
          {createdDate ? (
            <span className="inline-flex h-7 items-center rounded-full border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700">
              Đang lọc theo ngày: {formatInputDate(createdDate)}
            </span>
          ) : null}
        </div>
        <div className="iv-admin-filter-quick">
          <span className="iv-admin-filter-hint">Mốc nhanh:</span>
          {quickDateRanges.map((days) => {
            const quickRange = createQuickDateRange(days);
            const isActive =
              normalizedCreatedFrom === quickRange.createdFrom && normalizedCreatedTo === quickRange.createdTo;
            return (
              <Link
                key={days}
                href={{
                  pathname: "/admin/newsletter",
                  query: {
                    ...params,
                    createdDate: undefined,
                    createdFrom: quickRange.createdFrom,
                    createdTo: quickRange.createdTo,
                    page: "1",
                  },
                }}
                className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                  isActive
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {days} ngày
              </Link>
            );
          })}
          {hasActiveFilters ? (
            <Link
              href="/admin/newsletter"
              className="inline-flex h-8 items-center rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Xóa lọc nhanh
            </Link>
          ) : null}
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_auto] xl:items-end">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Email</span>
            <input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Email cần tìm..."
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <input type="hidden" name="createdFrom" value="" />
          <input type="hidden" name="createdTo" value="" />
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Ngày đăng ký</span>
            <input
              type="date"
              name="createdDate"
              defaultValue={createdDate}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <button
              type="submit"
              className="iv-btn-primary iv-admin-action-btn inline-flex h-10 w-full items-center justify-center px-5 text-sm font-semibold sm:w-auto"
            >
              Lọc dữ liệu
            </button>
            <Link
              href={{
                pathname: "/api/admin/newsletter/export",
                query: exportQuery,
              }}
              className="iv-btn-soft iv-admin-action-btn inline-flex h-10 w-full items-center justify-center px-4 text-sm font-semibold shadow-sm sm:w-auto"
            >
              Xuất CSV
            </Link>
            {hasActiveFilters ? (
              <Link
                href="/admin/newsletter"
                className="iv-admin-action-btn inline-flex h-10 w-full items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 sm:w-auto"
              >
                Xóa lọc
              </Link>
            ) : null}
          </div>
        </div>
        {activeFilterLabels.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilterLabels.map((label) => (
              <span key={label} className="iv-admin-filter-chip">
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </form>

      <div id="danh-sach-nhan-tin" className="scroll-mt-24" />
      {data.items.length ? (
        <>
          <AdminNewsletterTable items={data.items} />

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/85 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} đăng ký
            </p>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              {data.page > 1 ? (
                <Link
                  href={{
                    pathname: "/admin/newsletter",
                    query: {
                      ...params,
                      page: String(data.page - 1),
                    },
                  }}
                  className="iv-btn-soft inline-flex h-9 w-full items-center justify-center px-3 text-sm font-semibold sm:w-auto"
                >
                  Trang trước
                </Link>
              ) : (
                <span className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400 sm:w-auto">
                  Trang trước
                </span>
              )}
              {data.page < data.totalPages ? (
                <Link
                  href={{
                    pathname: "/admin/newsletter",
                    query: {
                      ...params,
                      page: String(data.page + 1),
                    },
                  }}
                  className="iv-btn-soft inline-flex h-9 w-full items-center justify-center px-3 text-sm font-semibold sm:w-auto"
                >
                  Trang sau
                </Link>
              ) : (
                <span className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400 sm:w-auto">
                  Trang sau
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Không có dữ liệu phù hợp"
          description="Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm."
          ctaHref="/admin/newsletter"
          ctaLabel="Xóa bộ lọc"
        />
      )}

      <MobileQuickActions
        items={[
          { href: "#bo-loc-nhan-tin", label: "Bộ lọc" },
          { href: "#danh-sach-nhan-tin", label: "Danh sách", active: true },
          { href: "/admin/inquiries", label: "Tư vấn" },
        ]}
      />
    </div>
  );
}

