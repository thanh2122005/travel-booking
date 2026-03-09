import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type UserLayoutProps = {
  children: React.ReactNode;
};

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
