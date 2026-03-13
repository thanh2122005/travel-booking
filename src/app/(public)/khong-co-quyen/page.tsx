import Link from "next/link";
import { Ban, Home, LogIn, MessageCircle } from "lucide-react";
import { MobileQuickActions } from "@/components/common/mobile-quick-actions";

export default function UnauthorizedPage() {
  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <section className="iv-card mx-auto max-w-2xl p-6 text-center md:p-8">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Ban className="h-7 w-7" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Truy cập bị từ chối</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          Bạn không có quyền vào trang này
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
          Phiên đăng nhập hiện tại không có đủ quyền truy cập. Hãy đăng nhập lại bằng tài khoản phù hợp hoặc liên hệ quản trị viên để được hỗ trợ.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/dang-nhap"
            className="iv-btn-primary inline-flex h-10 items-center justify-center px-4 text-sm font-semibold"
          >
            Đăng nhập lại
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Về trang chủ
          </Link>
        </div>
      </section>

      <section className="iv-card mx-auto max-w-2xl p-5">
        <h2 className="text-lg font-bold text-slate-900">Gợi ý tiếp theo</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link
            href="/dang-nhap"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Đăng nhập
          </Link>
          <Link
            href="/tai-khoan"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Tài khoản
          </Link>
          <Link
            href="/lien-he"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Liên hệ hỗ trợ
          </Link>
        </div>
      </section>

      <MobileQuickActions
        items={[
          { href: "/dang-nhap", label: "Đăng nhập", icon: LogIn, active: true },
          { href: "/", label: "Trang chủ", icon: Home },
          { href: "/lien-he", label: "Hỗ trợ", icon: MessageCircle },
        ]}
      />
    </div>
  );
}
