import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type PublicShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
  fullWidth?: boolean;
};

export function PublicShell({ children, mainClassName, fullWidth = false }: PublicShellProps) {
  return (
    <div className="iv-theme min-h-screen">
      <SiteHeader />
      <main className={cn("iv-shell-main", mainClassName)}>
        <div className={cn(!fullWidth && "iv-shell-container")}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
