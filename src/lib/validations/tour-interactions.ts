import { z } from "zod";

export const favoriteSchema = z.object({
  tourId: z.string().trim().min(1, "Thiếu thông tin tour"),
});

export const reviewSchema = z.object({
  tourId: z.string().trim().min(1, "Thiếu thông tin tour"),
  rating: z.coerce
    .number({ message: "Điểm đánh giá không hợp lệ" })
    .int("Điểm đánh giá không hợp lệ")
    .min(1, "Điểm đánh giá tối thiểu là 1")
    .max(5, "Điểm đánh giá tối đa là 5"),
  comment: z
    .string()
    .trim()
    .min(10, "Nội dung đánh giá cần ít nhất 10 ký tự")
    .max(1000, "Nội dung đánh giá tối đa 1000 ký tự"),
});

export type FavoriteInput = z.infer<typeof favoriteSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
