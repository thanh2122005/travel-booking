import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email là bắt buộc")
  .email("Email không đúng định dạng")
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(1, "Mật khẩu là bắt buộc")
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const registerBaseSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Họ và tên là bắt buộc")
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(80, "Họ và tên quá dài"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z
    .string()
    .min(1, "Vui lòng xác nhận mật khẩu")
    .min(8, "Mật khẩu xác nhận phải có ít nhất 8 ký tự"),
  phone: z.string().trim().max(15, "Số điện thoại không hợp lệ").optional().or(z.literal("")),
});

export const registerSchema = registerBaseSchema
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const registerInputSchema = registerBaseSchema.omit({
  confirmPassword: true,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
