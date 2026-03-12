"use client";

import Link from "next/link";
import { useEffect } from "react";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error("Lỗi toàn cục ứng dụng:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="bg-slate-100 text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
          <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Lỗi hệ thống</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Ứng dụng tạm thời gặp sự cố
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Vui lòng thử tải lại. Nếu lỗi vẫn tiếp diễn, hãy quay lại sau ít phút.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Tải lại ứng dụng
              </button>
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Về trang chủ
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}

