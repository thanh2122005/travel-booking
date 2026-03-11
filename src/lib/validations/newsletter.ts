import { z } from "zod";

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Vui lòng nhập email hợp lệ."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
