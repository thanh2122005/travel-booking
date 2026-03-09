import { SiteHeader } from "@/components/layout/site-header";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
