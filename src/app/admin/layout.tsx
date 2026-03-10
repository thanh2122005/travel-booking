import { ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { requireAdmin } from "@/lib/auth/session";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[250px_1fr] lg:py-8">
        <aside className="iv-card h-fit p-4 lg:sticky lg:top-24">
          <div className="mb-3 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-800">
            <p className="inline-flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Quản trị hệ thống
            </p>
            <p className="mt-1 text-xs text-teal-700">{session.user.email}</p>
          </div>
          <AdminNav />
        </aside>
        <section className="space-y-6">{children}</section>
      </main>
    </div>
  );
}
