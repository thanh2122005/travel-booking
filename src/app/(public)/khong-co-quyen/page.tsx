import Link from "next/link";
import { Ban } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center space-y-4 text-center">
      <Ban className="h-12 w-12 text-destructive" />
      <h1 className="text-3xl font-bold">Bạn không có quyền truy cập</h1>
      <p className="text-muted-foreground">Vui lòng đăng nhập bằng tài khoản phù hợp để tiếp tục.</p>
      <Link
        href="/dang-nhap"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Đến trang đăng nhập
      </Link>
    </section>
  );
}
