import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-3 md:px-6">
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Travel Booking System</h3>
          <p className="text-sm text-muted-foreground">
            Nền tảng đặt tour du lịch hiện đại, giao diện tiếng Việt, phù hợp demo đồ án và portfolio.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Liên kết nhanh</h4>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <Link href="/tours" className="hover:text-primary">
              Danh sách tour
            </Link>
            <Link href="/dia-diem" className="hover:text-primary">
              Danh sách địa điểm
            </Link>
            <Link href="/gioi-thieu" className="hover:text-primary">
              Giới thiệu
            </Link>
            <Link href="/lien-he" className="hover:text-primary">
              Liên hệ
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Thông tin</h4>
          <p className="text-sm text-muted-foreground">
            Mặc định hiển thị tiếng Việt.
            <br />
            © {new Date().getFullYear()} Travel Booking System.
          </p>
        </div>
      </div>
    </footer>
  );
}
