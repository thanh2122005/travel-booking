export type PublicNavItem = {
  href: string;
  label: string;
};

export const publicNavItems: PublicNavItem[] = [
  { href: "/", label: "Trang chu" },
  { href: "/tours", label: "Tours" },
  { href: "/destinations", label: "Diem den" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "Gioi thieu" },
  { href: "/contact", label: "Lien he" },
];

export const footerQuickLinks: PublicNavItem[] = [
  { href: "/tours", label: "Danh sach tour" },
  { href: "/booking", label: "Dat tour" },
  { href: "/favorites", label: "Yeu thich" },
  { href: "/reviews", label: "Danh gia" },
];

export const footerPopularDestinations: PublicNavItem[] = [
  { href: "/destinations/ha-noi", label: "Ha Noi" },
  { href: "/destinations/da-nang", label: "Da Nang" },
  { href: "/destinations/ha-long", label: "Ha Long" },
  { href: "/destinations/phu-quoc", label: "Phu Quoc" },
];
