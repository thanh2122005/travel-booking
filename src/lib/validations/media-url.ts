import { z } from "zod";

function isHttpUrl(value: string) {
  try {
    // Cho phép ảnh remote nhưng chỉ nhận protocol http/https.
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalPath(value: string) {
  // Cho phép đường dẫn ảnh local trong thư mục public.
  return /^\/(?!\/)\S+$/.test(value);
}

export function isValidMediaUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) return false;

  return isLocalPath(normalized) || isHttpUrl(normalized);
}

export function requiredMediaUrlSchema(
  requiredMessage: string,
  invalidMessage = "URL ảnh không hợp lệ.",
) {
  // Schema dùng cho trường bắt buộc có ảnh.
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => isValidMediaUrl(value), { message: invalidMessage });
}

export function optionalMediaUrlSchema(invalidMessage = "URL ảnh không hợp lệ.") {
  // Schema dùng cho trường ảnh optional (nếu có thì phải hợp lệ).
  return z
    .string()
    .trim()
    .min(1, invalidMessage)
    .refine((value) => isValidMediaUrl(value), { message: invalidMessage })
    .optional();
}

export function optionalNullableMediaUrlSchema(invalidMessage = "URL ảnh không hợp lệ.") {
  // Dùng cho field có thể null, ví dụ avatarUrl.
  return z
    .preprocess(
      (value) => {
        if (value === null || value === undefined) return value;
        if (typeof value !== "string") return value;

        const normalized = value.trim();
        return normalized.length ? normalized : null;
      },
      z.union([
        z.null(),
        z.string().refine((value) => isValidMediaUrl(value), { message: invalidMessage }),
      ]),
    )
    .optional();
}
