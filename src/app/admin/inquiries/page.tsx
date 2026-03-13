import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/prisma";
import { formatDate } from "@/lib/utils/format";
import { AdminInquiryActions } from "@/components/admin/admin-inquiry-actions";

export const metadata: Metadata = {
  title: "Quản lý yêu cầu tư vấn",
};

export const dynamic = "force-dynamic";

type AdminInquiriesPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminInquiriesPage({ searchParams }: AdminInquiriesPageProps) {
  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams.page) || 1);
  const pageSize = 15;

  const [total, inquiries] = await Promise.all([
    db.contactInquiry.count(),
    db.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        tour: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yêu cầu tư vấn</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý các yêu cầu tư vấn từ khách hàng.
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Liên hệ</th>
                <th className="px-4 py-3 font-medium">Chi tiết</th>
                <th className="px-4 py-3 font-medium">Nội dung</th>
                <th className="px-4 py-3 font-medium">Ngày gửi</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Chưa có yêu cầu tư vấn nào.
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      {inquiry.referenceCode}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {inquiry.fullName}
                    </td>
                    <td className="px-4 py-3">
                      <div>{inquiry.phone}</div>
                      <div className="text-xs text-muted-foreground">{inquiry.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {inquiry.tour ? (
                        <div className="max-w-[150px] truncate" title={inquiry.tour.title}>
                          Tour: {inquiry.tour.title}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">-</div>
                      )}
                      <div className="text-xs">
                        {inquiry.numberOfGuests} khách
                      </div>
                      {inquiry.departureDate && (
                        <div className="text-xs text-muted-foreground">
                          Khởi hành: {formatDate(inquiry.departureDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate text-xs" title={inquiry.message}>
                        {inquiry.message || <span className="text-muted-foreground italic">Không có tin nhắn</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {formatDate(inquiry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        inquiry.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}>
                        {inquiry.status === "RESOLVED" ? "Đã xử lý" : "Chờ xử lý"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminInquiryActions inquiryId={inquiry.id} status={inquiry.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Trang {page}/{totalPages} • Tổng {total} yêu cầu
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={{ pathname: "/admin/inquiries", query: { page: String(page - 1) } }}
              className="iv-btn-soft inline-flex h-9 items-center px-3 text-sm font-semibold"
            >
              Trang trước
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400">
              Trang trước
            </span>
          )}
          {page < totalPages ? (
            <Link
              href={{ pathname: "/admin/inquiries", query: { page: String(page + 1) } }}
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
    </div>
  );
}
