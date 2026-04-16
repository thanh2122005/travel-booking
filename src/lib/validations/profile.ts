import { z } from "zod";

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  // Chuẩn hóa input optional: rỗng -> undefined.
  return normalized ? normalized : undefined;
}

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có tối thiểu 2 ký tự.")
    .max(80, "Họ và tên không được vượt quá 80 ký tự."),
  phone: z
    .string()
    .optional()
    .transform(normalizeOptional)
    // Nếu có phone thì phải khớp pattern hợp lệ.
    .refine((value) => !value || /^[0-9+\s.-]{9,15}$/.test(value), "Số điện thoại không hợp lệ."),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
