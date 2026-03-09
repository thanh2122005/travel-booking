import { UserCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";

export default async function AccountPage() {
  const session = await requireUser();

  return (
    <section className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
        <UserCircle2 className="h-4 w-4" />
        Khu vực người dùng
      </div>
      <h1 className="text-3xl font-bold">Xin chào, {session.user.name}</h1>
      <p className="text-muted-foreground">
        Đây là trang nền tảng cho tài khoản người dùng. Các tính năng hồ sơ, booking, favorites và
        reviews sẽ được triển khai ở Phase 3.
      </p>
    </section>
  );
}
