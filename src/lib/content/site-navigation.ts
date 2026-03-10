export type PublicNavItem = {
  href: string;
  label: string;
};

export const publicNavItems: PublicNavItem[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/tours", label: "Tour" },
  { href: "/destinations", label: "Điểm đến" },
  { href: "/gallery", label: "Thư viện" },
  { href: "/about", label: "Giới thiệu" },
  { href: "/contact", label: "Liên hệ" },
];

export const footerQuickLinks: PublicNavItem[] = [
  { href: "/tours", label: "Danh sách tour" },
  { href: "/booking", label: "Đặt tour" },
  { href: "/favorites", label: "Yêu thích" },
  { href: "/reviews", label: "Đánh giá" },
];

export const footerPopularDestinations: PublicNavItem[] = [
  { href: "/destinations/ha-noi", label: "Hà Nội" },
  { href: "/destinations/da-nang", label: "Đà Nẵng" },
  { href: "/destinations/ha-long", label: "Hạ Long" },
  { href: "/destinations/phu-quoc", label: "Phú Quốc" },
];
