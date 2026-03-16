import Link from "next/link";
import { formatDate } from "@/lib/utils/format";
import type { DashboardSubscriber } from "@/components/admin/dashboard/types";

type NewSubscribersProps = {
  items: DashboardSubscriber[];
};

export function NewSubscribers({ items }: NewSubscribersProps) {
  return (
    <article className="iv-card rounded-2xl border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-700">Email đăng ký mới</h3>
        <Link href="/admin/newsletter" className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">
          Xem tất cả
        </Link>
      </div>

      {items.length ? (
        <div className="space-y-2.5">
          {items.slice(0, 7).map((subscriber) => (
            <article key={subscriber.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <p className="truncate text-sm text-slate-700">{subscriber.email}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(subscriber.createdAt)}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Chưa có email đăng ký mới.
        </p>
      )}
    </article>
  );
}
