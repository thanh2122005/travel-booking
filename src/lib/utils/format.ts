export function formatPrice(value: number) {
  // Format tiền theo chuẩn VND hiển thị cho người dùng VN.
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(days: number, nights: number) {
  // Chuỗi thời lượng dùng chung cho card/list/detail.
  return `${days} \u006E\u0067\u00E0\u0079 ${nights} \u0111\u00EA\u006D`;
}

export function formatDate(value: Date) {
  // Chốt timezone Asia/Ho_Chi_Minh để không lệch ngày khi deploy.
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(value);
}

export function getTourDisplayPrice(price: number, discountPrice: number | null) {
  // Nếu có giá khuyến mãi thì ưu tiên hiển thị giá đó.
  return discountPrice ?? price;
}
