import { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db/prisma";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Quản lý đăng ký nhận tin",
};

export const dynamic = "force-dynamic";

type AdminNewsletterPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminNewsletterPage({ searchParams }: AdminNewsletterPageProps) {
  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams.page) || 1);
  const pageSize = 15;

  const [total, subscribers] = await Promise.all([
    db.newsletterSubscriber.count(),
    db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đăng ký nhận tin</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách email đăng ký nhận bản tin khuyến mãi.
          </p>
        </div>
        <Link
          href="/api/admin/newsletter/export"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <Download className="mr-2 h-4 w-4" />
          Xuất dữ liệu CSV
        </Link>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-muted-foreground">
                    Chưa có người đăng ký nhận tin.
                  </td>
                </tr>
              ) : (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(subscriber.createdAt)}
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
          Trang {page}/{totalPages} • Tổng {total} đăng ký
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={{ pathname: "/admin/newsletter", query: { page: String(page - 1) } }}
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
              href={{ pathname: "/admin/newsletter", query: { page: String(page + 1) } }}
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
