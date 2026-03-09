export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-semibold">Đang tải dữ liệu...</p>
        <p className="mt-1 text-sm text-muted-foreground">Vui lòng chờ trong giây lát.</p>
      </div>
    </div>
  );
}
