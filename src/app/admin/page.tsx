import { LayoutDashboard } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminPage() {
  const session = await requireAdmin();

  return (
    <section className="space-y-4 p-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
        <LayoutDashboard className="h-4 w-4" />
        Khu vực quản trị
      </div>
      <h1 className="text-3xl font-bold">Xin chào quản trị viên, {session.user.name}</h1>
      <p className="text-muted-foreground">
        Đây là khung admin nền tảng cho Phase 1. Dashboard và CRUD đầy đủ sẽ được triển khai ở
        Phase 4.
      </p>
    </section>
  );
}
