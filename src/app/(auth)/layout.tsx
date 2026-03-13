import Link from "next/link";
import { Compass } from "lucide-react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-blue-50 to-teal-50 px-4 py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-md space-y-4">
        <div className="space-y-3 rounded-2xl border border-white/60 bg-white/85 p-4 text-center shadow-sm backdrop-blur">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700">
            <Compass className="h-4 w-4 text-teal-600" />
            ImmersiveVietnam
          </Link>
          <p className="text-sm leading-6 text-slate-600">
            Đăng nhập hoặc tạo tài khoản để quản lý đặt tour, yêu thích và đánh giá hành trình.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
