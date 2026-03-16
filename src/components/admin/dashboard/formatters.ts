export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function deltaToneClass(tone: "up" | "down" | "flat") {
  if (tone === "up") return "text-emerald-600";
  if (tone === "down") return "text-rose-600";
  return "text-slate-500";
}

