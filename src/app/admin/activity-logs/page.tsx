import Link from "next/link";
import { Activity, FilterX, Search } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";
import { getAdminActivityLogs } from "@/lib/db/admin-queries";
import { formatDate } from "@/lib/utils/format";

type AdminActivityLogsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value?: string | string[]) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function toValidPage(value: string) {
  const page = Number(value || "1");
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.trunc(page);
}

const ACTION_LABELS: Record<string, string> = {
  BOOKING_STATUS_UPDATED: "Cập nhật trạng thái đơn",
  BOOKING_PAYMENT_UPDATED: "Cập nhật thanh toán",
  BOOKING_TICKET_ISSUED: "Phát hành vé/mã check-in",
  BOOKING_CHECKED_IN: "Đánh dấu check-in",
  BOOKING_DETAIL_UPDATED: "Cập nhật chi tiết đơn đặt tour",
  ADMIN_LOGIN: "Đăng nhập admin",
  REVIEW_VISIBILITY_UPDATED: "Cập nhật hiển thị đánh giá",
  REVIEW_CONTENT_UPDATED: "Cập nhật nội dung đánh giá",
  REVIEWS_BULK_UPDATED: "Cập nhật hàng loạt đánh giá",
  USER_UPDATED: "Cập nhật người dùng",
  USER_CONTENT_UPDATED: "Cập nhật chi tiết người dùng",
  USERS_BULK_UPDATED: "Cập nhật hàng loạt người dùng",
  USER_DELETED: "Xóa người dùng",
  NEWSLETTER_BULK_DELETED: "Xóa email nhận tin hàng loạt",
  INQUIRY_STATUS_UPDATED: "Cập nhật trạng thái tư vấn",
  INQUIRIES_BULK_UPDATED: "Cập nhật hàng loạt tư vấn",
};

const ACTION_TONES: Record<string, string> = {
  BOOKING_STATUS_UPDATED: "border-sky-200 bg-sky-50 text-sky-700",
  BOOKING_PAYMENT_UPDATED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  BOOKING_TICKET_ISSUED: "border-violet-200 bg-violet-50 text-violet-700",
  BOOKING_CHECKED_IN: "border-teal-200 bg-teal-50 text-teal-700",
  BOOKING_DETAIL_UPDATED: "border-amber-200 bg-amber-50 text-amber-700",
  ADMIN_LOGIN: "border-cyan-200 bg-cyan-50 text-cyan-700",
  REVIEW_VISIBILITY_UPDATED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  REVIEW_CONTENT_UPDATED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  REVIEWS_BULK_UPDATED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  USER_UPDATED: "border-slate-300 bg-slate-50 text-slate-700",
  USER_CONTENT_UPDATED: "border-slate-300 bg-slate-50 text-slate-700",
  USERS_BULK_UPDATED: "border-slate-300 bg-slate-50 text-slate-700",
  USER_DELETED: "border-rose-200 bg-rose-50 text-rose-700",
  NEWSLETTER_BULK_DELETED: "border-rose-200 bg-rose-50 text-rose-700",
  INQUIRY_STATUS_UPDATED: "border-orange-200 bg-orange-50 text-orange-700",
  INQUIRIES_BULK_UPDATED: "border-orange-200 bg-orange-50 text-orange-700",
};

const DETAIL_KEY_LABELS: Record<string, string> = {
  status: "Trạng thái",
  paymentStatus: "Trạng thái thanh toán",
  ticketCode: "Mã vé",
  checkInCode: "Mã check-in",
  source: "Nguồn cập nhật",
  mode: "Chế độ",
  count: "Số lượng",
  inquiryId: "Mã tư vấn",
  referenceCode: "Mã tham chiếu",
  reviewId: "Mã đánh giá",
  userId: "Mã người dùng",
  fullName: "Họ tên",
  email: "Email",
  isVisible: "Hiển thị",
  role: "Vai trò",
};

const FIELD_LABELS: Record<string, string> = {
  fullName: "Họ tên",
  email: "Email",
  phone: "Số điện thoại",
  numberOfGuests: "Số khách",
  note: "Ghi chú",
  departureDate: "Ngày khởi hành",
  paymentMethod: "Phương thức thanh toán",
  roomType: "Loại phòng",
  singleRoomGuests: "Số khách ở phòng đơn",
  pickupMethod: "Nhu cầu đón",
  pickupLocation: "Điểm đón mong muốn",
  status: "Trạng thái đơn",
  paymentStatus: "Trạng thái thanh toán",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn thành",
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  RESOLVED: "Đã xử lý",
  ACTIVE: "Hoạt động",
  BLOCKED: "Bị khóa",
  USER: "Người dùng",
  ADMIN: "Quản trị viên",
  SELF_ARRIVAL: "Tự đến điểm hẹn",
  NEED_PICKUP: "Cần hỗ trợ đón",
};

function formatLogDetail(detailJson?: string | null) {
  if (!detailJson) return "-";

  try {
    const parsed = JSON.parse(detailJson) as Record<string, unknown>;
    const lines: string[] = [];

    for (const [key, value] of Object.entries(parsed)) {
      if (value === null || value === undefined || value === "") continue;

      if (key === "changedFields" && Array.isArray(value)) {
        const labels = value
          .map((item) => String(item))
          .map((field) => FIELD_LABELS[field] ?? field);
        if (labels.length) {
          lines.push(`Trường thay đổi: ${labels.join(", ")}`);
        }
        continue;
      }

      const label = DETAIL_KEY_LABELS[key] ?? key;
      const resolvedValue =
        typeof value === "string" && STATUS_LABELS[value] ? STATUS_LABELS[value] : String(value);
      lines.push(`${label}: ${resolvedValue}`);
    }

    return lines.length ? lines.join(" • ") : "-";
  } catch {
    return detailJson;
  }
}

function toDetailItems(detailJson?: string | null) {
  const detail = formatLogDetail(detailJson);
  if (!detail || detail === "-") return [];
  return detail.split(" • ").map((item) => item.trim()).filter(Boolean);
}

export default async function AdminActivityLogsPage({ searchParams }: AdminActivityLogsPageProps) {
  const params = await searchParams;
  const search = normalizeParam(params.search);
  const page = toValidPage(normalizeParam(params.page));
  const hasActiveFilters = Boolean(search);
  const activeFilterLabels = search ? [`Từ khóa: ${search}`] : [];

  let data: Awaited<ReturnType<typeof getAdminActivityLogs>> | null = null;
  let loadFailed = false;
  try {
    data = await getAdminActivityLogs({
      search: search || undefined,
      page,
      pageSize: 30,
    });
  } catch {
    loadFailed = true;
  }

  if (!data) {
    return (
      <EmptyState
        title={loadFailed ? "Không thể tải nhật ký hoạt động" : "Chưa có nhật ký hoạt động"}
        description="Vui lòng thử lại sau."
        ctaHref="/admin/activity-logs"
        ctaLabel="Thử lại"
      />
    );
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="iv-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              <Activity className="h-3.5 w-3.5" />
              Theo dõi hoạt động
            </p>
            <h1 className="mt-3 iv-admin-page-title">Nhật ký hoạt động</h1>
            <p className="iv-admin-page-subtitle">
              Theo dõi thao tác đơn đặt tour và các hành động quản trị: đánh giá, thành viên, tư vấn, nhận tin.
            </p>
          </div>
          <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/70 px-4 py-3 text-right shadow-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tổng log</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{data.total}</p>
            <p className="text-xs text-slate-500">
              Trang {data.page}/{data.totalPages}
            </p>
          </div>
        </div>
      </div>

      <form id="bo-loc-nhat-ky" className="iv-admin-filter-form">
        <input type="hidden" name="page" value="1" />
        <label htmlFor="search" className="iv-admin-filter-title">
          Tìm kiếm nhật ký
        </label>
        <div className="iv-admin-filter-grid">
          <label className="relative block sm:col-span-2 xl:col-span-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Mã đơn, hành động, người thao tác..."
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
        </div>
        <div className="iv-admin-filter-actions">
          <button
            type="submit"
            className="iv-btn-primary iv-admin-action-btn inline-flex h-10 w-full items-center justify-center px-5 text-sm font-semibold sm:w-auto"
          >
            Lọc dữ liệu
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/activity-logs"
              className="iv-admin-action-btn inline-flex h-10 w-full items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 sm:w-auto"
            >
              <FilterX className="mr-1.5 h-4 w-4" />
              Xóa bộ lọc
            </Link>
          ) : null}
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

      <div id="danh-sach-nhat-ky" className="scroll-mt-24" />
      {data.items.length ? (
        <>
          <div className="space-y-3 lg:hidden">
            {data.items.map((item) => {
              const details = toDetailItems(item.detailJson);
              return (
                <article key={item.id} className="iv-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ACTION_TONES[item.action] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}
                    >
                      {ACTION_LABELS[item.action] ?? item.action}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(new Date(item.createdAt))}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700">
                    <p>
                      <span className="text-slate-500">Mã đơn:</span>{" "}
                      {item.bookingCode ? (
                        <Link href="/admin/bookings" className="font-semibold text-teal-700 hover:text-teal-800">
                          {item.bookingCode}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </p>
                    <p>
                      <span className="text-slate-500">Người thao tác:</span> {item.actorName || "Quản trị viên"}
                    </p>
                  </div>
                  {details.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {details.map((detail) => (
                        <span
                          key={`${item.id}-${detail}`}
                          className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="iv-card hidden lg:block">
            <div className="iv-admin-table-scroll">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th className="w-[118px] px-3 py-3 whitespace-nowrap">Thời gian</th>
                    <th className="w-[220px] px-3 py-3 whitespace-nowrap">Hành động</th>
                    <th className="w-[140px] px-3 py-3 whitespace-nowrap">Mã đơn</th>
                    <th className="w-[150px] px-3 py-3 whitespace-nowrap">Người thao tác</th>
                    <th className="px-3 py-3 whitespace-nowrap">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => {
                    const details = toDetailItems(item.detailJson);
                    return (
                      <tr key={item.id} className="border-b border-slate-100 align-top last:border-0">
                        <td className="px-3 py-3 text-xs text-slate-600">{formatDate(new Date(item.createdAt))}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ACTION_TONES[item.action] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}
                          >
                            {ACTION_LABELS[item.action] ?? item.action}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {item.bookingCode ? (
                            <Link
                              href="/admin/bookings"
                              className="inline-flex rounded-md border border-teal-200 bg-teal-50 px-2 py-1 font-semibold text-teal-700 hover:bg-teal-100"
                            >
                              {item.bookingCode}
                            </Link>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          <span className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium">
                            {item.actorName || "Quản trị viên"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {details.length ? (
                            <div className="flex max-w-[520px] flex-wrap gap-1.5">
                              {details.map((detail) => (
                                <span
                                  key={`${item.id}-${detail}`}
                                  className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                                >
                                  {detail}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Chưa có nhật ký phù hợp"
          description="Hãy thử đổi bộ lọc hoặc thao tác thêm trên khu vực admin."
          ctaHref="/admin/bookings"
          ctaLabel="Tới trang đơn đặt tour"
        />
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/85 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Trang {data.page}/{data.totalPages} • Tổng {data.total} log
        </p>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {data.page > 1 ? (
            <Link
              href={{
                pathname: "/admin/activity-logs",
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
            <span className="inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400 sm:w-auto">
              Trang trước
            </span>
          )}
          {data.page < data.totalPages ? (
            <Link
              href={{
                pathname: "/admin/activity-logs",
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
            <span className="inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400 sm:w-auto">
              Trang sau
            </span>
          )}
        </div>
      </div>

      <MobileQuickActions
        items={[
          { href: "#bo-loc-nhat-ky", label: "Bộ lọc" },
          { href: "#danh-sach-nhat-ky", label: "Nhật ký", active: true },
          { href: "/admin", label: "Dashboard" },
        ]}
      />
    </div>
  );
}


