import Link from "next/link";
import { AdminReviewsList } from "@/components/admin/admin-reviews-list";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { getAdminReviews } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

type AdminReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
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

function parseVisibleFilter(value: string) {
  if (value === "visible") return true;
  if (value === "hidden") return false;
  return undefined;
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

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const isVisible = normalizeParam(params.isVisible);
  const createdFrom = normalizeParam(params.createdFrom);
  const createdTo = normalizeParam(params.createdTo);
  const page = toValidPage(normalizeParam(params.page));
  const hasActiveFilters = Boolean(search || isVisible || createdFrom || createdTo);
  const exportQuery = {
    ...(search ? { search } : {}),
    ...(isVisible ? { isVisible } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
  };

  const data = await getAdminReviews({
    search: search || undefined,
    isVisible: parseVisibleFilter(isVisible),
    createdFrom: parseDateAtBoundary(createdFrom, "start"),
    createdTo: parseDateAtBoundary(createdTo, "end"),
    page,
    pageSize: 15,
  }).catch(() => null);

  if (!data) {
    return (
      <EmptyState
        title="Không thể tải danh sách đánh giá"
        description="Vui lòng kiểm tra kết nối cơ sở dữ liệu rồi thử lại."
        ctaHref="/admin/reviews"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý đánh giá</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi phản hồi người dùng, lọc theo thời gian và ẩn/hiện nhiều đánh giá cùng lúc.
        </p>
      </div>

      <section className="iv-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Đi đến nhanh</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="#bo-loc-review"
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Bộ lọc review
          </a>
          <a
            href="#danh-sach-review"
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Danh sách
          </a>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
          >
            Dashboard
          </Link>
        </div>
      </section>

      <form id="bo-loc-review" className="iv-card scroll-mt-24 p-4">
        <label
          htmlFor="search"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
        >
          Tìm kiếm đánh giá
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
                  pathname: "/admin/reviews",
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
          {hasActiveFilters ? (
            <Link
              href="/admin/reviews"
              className="inline-flex h-8 items-center rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Xóa bộ lọc
            </Link>
          ) : null}
        </div>
        <div className="grid gap-2 lg:grid-cols-[1fr_170px_170px_170px_auto]">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Nội dung review, tên người dùng hoặc tên tour..."
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            name="isVisible"
            defaultValue={isVisible}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="visible">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
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
          <button
            type="submit"
            className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold"
          >
            Lọc dữ liệu
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <Link
            href={{
              pathname: "/api/admin/reviews/export",
              query: exportQuery,
            }}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Xuất CSV
          </Link>
        </div>
      </form>

      <div id="danh-sach-review" className="scroll-mt-24" />
      {data.items.length ? (
        <>
          <AdminReviewsList items={data.items} />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} đánh giá
            </p>
            <div className="flex gap-2">
              {data.page > 1 ? (
                <Link
                  href={{
                    pathname: "/admin/reviews",
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
                <span className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
                  Trang trước
                </span>
              )}
              {data.page < data.totalPages ? (
                <Link
                  href={{
                    pathname: "/admin/reviews",
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
                <span className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
                  Trang sau
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Không có đánh giá phù hợp"
          description="Hãy thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem toàn bộ dữ liệu."
          ctaHref="/admin/reviews"
          ctaLabel="Xóa bộ lọc"
        />
      )}

      <MobileQuickActions
        items={[
          { href: "#bo-loc-review", label: "Bộ lọc" },
          { href: "#danh-sach-review", label: "Danh sách", active: true },
          { href: "/admin/bookings", label: "Bookings" },
        ]}
      />
    </div>
  );
}
