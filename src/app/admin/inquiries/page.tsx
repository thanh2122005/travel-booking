import { InquiryStatus } from "@prisma/client";
import Link from "next/link";
import { AdminInquiriesTable } from "@/components/admin/admin-inquiries-table";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { getAdminInquiries } from "@/lib/db/admin-engagement-queries";


export const dynamic = "force-dynamic";

type AdminInquiriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const inquiryStatusValues: InquiryStatus[] = [InquiryStatus.PENDING, InquiryStatus.RESOLVED];
const quickDateRanges = [7, 30, 90] as const;

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
    return `Ngày gửi: ${formatInputDate(createdFrom)} - ${formatInputDate(createdTo)}`;
  }
  if (createdFrom) {
    return `Gửi từ ngày: ${formatInputDate(createdFrom)}`;
  }
  if (createdTo) {
    return `Gửi đến ngày: ${formatInputDate(createdTo)}`;
  }
  return "";
}

export default async function AdminInquiriesPage({ searchParams }: AdminInquiriesPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const statusRaw = normalizeParam(params.status);
  const createdFrom = normalizeParam(params.createdFrom);
  const createdTo = normalizeParam(params.createdTo);
  const page = toValidPage(normalizeParam(params.page));

  const status = inquiryStatusValues.includes(statusRaw as InquiryStatus)
    ? (statusRaw as InquiryStatus)
    : undefined;
  const hasActiveFilters = Boolean(search || status || createdFrom || createdTo);
  const exportQuery = {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
  };
  const dateRangeLabel = buildDateRangeLabel(createdFrom, createdTo);
  const activeFilterLabels = [
    ...(search ? [`Từ khóa: ${search}`] : []),
    ...(status ? [`Trạng thái: ${status === "RESOLVED" ? "Đã xử lý" : "Chờ xử lý"}`] : []),
    ...(dateRangeLabel ? [dateRangeLabel] : []),
  ];

  const data = await getAdminInquiries({
    search: search || undefined,
    status,
    createdFrom: parseDateAtBoundary(createdFrom, "start"),
    createdTo: parseDateAtBoundary(createdTo, "end"),
    page,
    pageSize: 15,
  }).catch(() => null);

  if (!data) {
    return (
      <EmptyState
        title="Không thể tải yêu cầu tư vấn"
        description="Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
        ctaHref="/admin/inquiries"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Yêu cầu tư vấn</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi yêu cầu liên hệ từ người dùng và cập nhật trạng thái xử lý.
        </p>
      </div>

      <form id="bo-loc-tu-van" className="iv-card scroll-mt-24 p-4">
        <input type="hidden" name="page" value="1" />
        <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm kiếm yêu cầu
        </label>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Mốc nhanh:</span>
          {quickDateRanges.map((days) => {
            const quickRange = createQuickDateRange(days);
            const isActive =
              createdFrom === quickRange.createdFrom && createdTo === quickRange.createdTo;
            return (
              <Link
                key={days}
                href={{
                  pathname: "/admin/inquiries",
                  query: {
                    ...params,
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
        </div>
        <div className="grid gap-2 xl:grid-cols-[1fr_190px_170px_170px_auto_auto]">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Mã, tên khách, email, số điện thoại..."
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="RESOLVED">Đã xử lý</option>
          </select>
          <input
            type="date"
            name="createdFrom"
            defaultValue={createdFrom}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <input
            type="date"
            name="createdTo"
            defaultValue={createdTo}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            Lọc dữ liệu
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/inquiries"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Xóa lọc
            </Link>
          ) : null}
        </div>
        {activeFilterLabels.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilterLabels.map((label) => (
              <span
                key={label}
                className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex justify-end">
          <Link
            href={{
              pathname: "/api/admin/inquiries/export",
              query: exportQuery,
            }}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Xuất CSV
          </Link>
        </div>
      </form>

      <div id="danh-sach-tu-van" className="scroll-mt-24" />
      {data.items.length ? (
        <>
          <AdminInquiriesTable items={data.items} />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} yêu cầu
            </p>
            <div className="flex gap-2">
              {data.page > 1 ? (
                <Link
                  href={{
                    pathname: "/admin/inquiries",
                    query: {
                      ...params,
                      page: String(data.page - 1),
                    },
                  }}
                  className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
                >
                  Trang trước
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
                  Trang trước
                </span>
              )}
              {data.page < data.totalPages ? (
                <Link
                  href={{
                    pathname: "/admin/inquiries",
                    query: {
                      ...params,
                      page: String(data.page + 1),
                    },
                  }}
                  className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
                >
                  Trang sau
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
                  Trang sau
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Không có yêu cầu phù hợp"
          description="Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm."
          ctaHref="/admin/inquiries"
          ctaLabel="Xóa bộ lọc"
        />
      )}

      <MobileQuickActions
        items={[
          { href: "#bo-loc-tu-van", label: "Bộ lọc" },
          { href: "#danh-sach-tu-van", label: "Danh sách", active: true },
          { href: "/admin/newsletter", label: "Nhận tin" },
        ]}
      />
    </div>
  );
}

