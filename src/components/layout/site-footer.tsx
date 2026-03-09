export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-sm text-muted-foreground md:flex-row md:px-6 md:text-left">
        <p>© {new Date().getFullYear()} Travel Booking System. Đồ án web du lịch full-stack.</p>
        <p>Ngôn ngữ hiển thị mặc định: Tiếng Việt.</p>
      </div>
    </footer>
  );
}
