import Link from "next/link";
import { AdminReviewsList } from "@/components/admin/admin-reviews-list";
import { EmptyState } from "@/components/common/empty-state";
import { getAdminReviews } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

type AdminReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const isVisible = normalizeParam(params.isVisible);
  const createdFrom = normalizeParam(params.createdFrom);
  const createdTo = normalizeParam(params.createdTo);
  const page = toValidPage(normalizeParam(params.page));

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
    <div className="space-y-5">
      <div className="iv-card p-5">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý đánh giá</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi phản hồi người dùng, lọc theo thời gian và ẩn/hiện nhiều đánh giá cùng lúc.
        </p>
      </div>

      <form className="iv-card p-4">
        <label
          htmlFor="search"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
        >
          Tìm kiếm đánh giá
        </label>
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
      </form>

      {data.items.length ? (
        <>
          <AdminReviewsList items={data.items} />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Trang {data.page}/{data.totalPages} • Tổng {data.total} đánh giá
            </p>
            <div className="flex gap-2">
              <Link
                href={{
                  pathname: "/admin/reviews",
                  query: {
                    ...params,
                    page: String(Math.max(data.page - 1, 1)),
                  },
                }}
                className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
              >
                Trang trước
              </Link>
              <Link
                href={{
                  pathname: "/admin/reviews",
                  query: {
                    ...params,
                    page: String(Math.min(data.page + 1, data.totalPages)),
                  },
                }}
                className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
              >
                Trang sau
              </Link>
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
    </div>
  );
}
