"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center justify-center px-4 py-10">
      <article className="iv-card w-full rounded-3xl border-slate-200/80 bg-white p-6 md:p-8">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <h1 className="mt-4 text-2xl font-semibold text-slate-800">Có lỗi khi tải khu vực quản trị</h1>
        <p className="mt-2 text-sm text-slate-600">
          Hệ thống gặp sự cố tạm thời. Bạn có thể thử tải lại hoặc quay về trang tổng quan.
        </p>

        {process.env.NODE_ENV !== "production" ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error.message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="iv-btn-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold"
          >
            Thử lại
          </button>
          <Link
            href="/admin"
            className="iv-btn-soft inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold"
          >
            Về tổng quan
          </Link>
        </div>
      </article>
    </div>
  );
}
