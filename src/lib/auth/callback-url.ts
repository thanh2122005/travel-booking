export function sanitizeRelativeCallbackUrl(value?: string | null) {
  if (!value) return undefined;

  const normalized = value.trim();
  if (!normalized) return undefined;
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return undefined;

  return normalized;
}

export function buildCallbackUrl(pathname: string, search = "") {
  const candidate = `${pathname || "/"}${search || ""}`;
  return sanitizeRelativeCallbackUrl(candidate) ?? "/";
}
