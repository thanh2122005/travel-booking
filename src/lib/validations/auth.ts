import { z } from "zod";

const emailSchema = z
  // Chuẩn hóa email để query/lưu DB nhất quán.
  .string()
  .trim()
  .min(1, "Email là bắt buộc")
  .email("Email không đúng định dạng")
  .toLowerCase();

const passwordSchema = z
  // Rule mật khẩu tối thiểu dùng cho auth cơ bản.
  .string()
  .min(1, "Mật khẩu là bắt buộc")
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email hoặc tên đăng nhập").toLowerCase(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
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
  // Bảo đảm password và confirmPassword trùng nhau.
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const registerInputSchema = registerBaseSchema.omit({
  confirmPassword: true,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Mã OTP phải gồm 6 chữ số."),
    newPassword: passwordSchema,
    confirmNewPassword: z
      .string()
      .min(1, "Vui lòng xác nhận mật khẩu mới")
      .min(8, "Mật khẩu xác nhận phải có ít nhất 8 ký tự"),
  })
  // Bảo đảm 2 trường mật khẩu mới trùng nhau.
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmNewPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

