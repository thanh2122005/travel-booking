import { z } from "zod";

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export const contactInquirySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập họ và tên tối thiểu 2 ký tự.")
    .max(80, "Họ và tên không được vượt quá 80 ký tự."),
  phone: z
    .string()
    .trim()
    .min(9, "Số điện thoại không hợp lệ.")
    .max(15, "Số điện thoại không hợp lệ.")
    .regex(/^[0-9+\s.-]+$/, "Số điện thoại chỉ bao gồm chữ số hoặc ký tự + - ."),
  email: z.string().trim().email("Vui lòng nhập email hợp lệ."),
  tourId: z.string().optional().transform(normalizeOptional),
  departureDate: z
    .string()
    .optional()
    .transform(normalizeOptional)
    .refine((value) => {
      if (!value) return true;
      return !Number.isNaN(new Date(value).getTime());
    }, "Ngày khởi hành không hợp lệ."),
  numberOfGuests: z
    .coerce
    .number({ message: "Số khách phải là số." })
    .int("Số khách phải là số nguyên.")
    .min(1, "Số khách tối thiểu là 1.")
    .max(20, "Số khách tối đa là 20."),
  message: z
    .string()
    .trim()
    .min(10, "Vui lòng mô tả yêu cầu tối thiểu 10 ký tự.")
    .max(1000, "Nội dung không được vượt quá 1000 ký tự."),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
