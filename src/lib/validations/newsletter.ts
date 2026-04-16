import { z } from "zod";

export const newsletterSchema = z.object({
  // Email bắt buộc đúng định dạng để phục vụ gửi bản tin.
  email: z
    .string()
    .trim()
    .email("Vui lòng nhập email hợp lệ."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
