export function sanitizeRelativeCallbackUrl(value?: string | null) {
  if (!value) return undefined;

  const normalized = value.trim();
  if (!normalized) return undefined;
  // Chỉ cho phép path nội bộ để tránh open redirect.
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return undefined;

  return normalized;
}

export function buildCallbackUrl(pathname: string, search = "") {
  // Ghép pathname + query rồi sanitize để dùng an toàn khi redirect login.
  const candidate = `${pathname || "/"}${search || ""}`;
  return sanitizeRelativeCallbackUrl(candidate) ?? "/";
}
