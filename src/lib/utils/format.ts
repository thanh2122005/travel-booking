export function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(days: number, nights: number) {
  return `${days} ngày ${nights} đêm`;
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

export function getTourDisplayPrice(price: number, discountPrice: number | null) {
  return discountPrice ?? price;
}
