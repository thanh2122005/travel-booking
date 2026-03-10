import Link from "next/link";
import { AdminReviewActions } from "@/components/admin/admin-review-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { getAdminReviews } from "@/lib/db/admin-queries";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type AdminReviewsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const page = Number(normalizeParam(params.page) || "1");

  const data = await getAdminReviews({
    search: search || undefined,
    page: Number.isFinite(page) ? page : 1,
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
        <p className="mt-1 text-sm text-slate-600">Theo dõi nội dung phản hồi, rating và trạng thái hiển thị.</p>
      </div>

      <form className="iv-card p-4">
        <label htmlFor="search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tìm kiếm đánh giá
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Nội dung review, tên user hoặc tên tour..."
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <button type="submit" className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            Tìm kiếm
          </button>
        </div>
      </form>

      {data.items.length ? (
        <>
          <div className="space-y-3">
            {data.items.map((review) => (
              <article key={review.id} className="iv-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{review.user.fullName}</p>
                    <p className="text-xs text-slate-500">{review.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{review.rating}/5</Badge>
                    <Badge variant={review.isVisible ? "default" : "secondary"}>
                      {review.isVisible ? "Đang hiển thị" : "Ẩn"}
                    </Badge>
                    <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{review.comment}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Tour:{" "}
                  <Link href={`/tours/${review.tour.slug}`} className="font-medium text-teal-700 hover:text-teal-800">
                    {review.tour.title}
                  </Link>
                </p>
                <div className="mt-3">
                  <AdminReviewActions reviewId={review.id} isVisible={review.isVisible} />
                </div>
              </article>
            ))}
          </div>

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
          description="Hãy thử từ khóa khác để tìm kiếm."
          ctaHref="/admin/reviews"
          ctaLabel="Xóa bộ lọc"
        />
      )}
    </div>
  );
}
