import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center space-y-4 px-4 text-center">
      <h1 className="text-4xl font-bold">Không tìm thấy trang</h1>
      <p className="text-muted-foreground">
        Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Quay về trang chủ
      </Link>
    </div>
  );
}
