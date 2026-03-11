export type PublicNavItem = {
  href: string;
  label: string;
};

export const publicNavItems: PublicNavItem[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/tours", label: "Tour" },
  { href: "/dia-diem", label: "Điểm đến" },
  { href: "/gallery", label: "Thư viện" },
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/lien-he", label: "Liên hệ" },
];

export const footerQuickLinks: PublicNavItem[] = [
  { href: "/tours", label: "Danh sách tour" },
  { href: "/booking", label: "Đặt tour" },
  { href: "/favorites", label: "Yêu thích" },
  { href: "/reviews", label: "Đánh giá" },
];

export const footerPopularDestinations: PublicNavItem[] = [
  { href: "/dia-diem/ha-noi", label: "Hà Nội" },
  { href: "/dia-diem/da-nang", label: "Đà Nẵng" },
  { href: "/dia-diem/ha-long", label: "Hạ Long" },
  { href: "/dia-diem/phu-quoc", label: "Phú Quốc" },
];

