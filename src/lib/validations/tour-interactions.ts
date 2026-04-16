import { z } from "zod";

export const favoriteSchema = z.object({
  // Chỉ cần tourId để toggle favorite theo cặp userId + tourId.
  tourId: z.string().trim().min(1, "Thiếu thông tin tour"),
});

export const reviewSchema = z.object({
  // Review gắn với tour cụ thể.
  tourId: z.string().trim().min(1, "Thiếu thông tin tour"),
  rating: z.coerce
    // Coerce để nhận cả số dạng string từ form.
    .number({ message: "Điểm đánh giá không hợp lệ" })
    .int("Điểm đánh giá không hợp lệ")
    .min(1, "Điểm đánh giá tối thiểu là 1")
    .max(5, "Điểm đánh giá tối đa là 5"),
  comment: z
    // Bắt buộc review có nội dung đủ chi tiết.
    .string()
    .trim()
    .min(10, "Nội dung đánh giá cần ít nhất 10 ký tự")
    .max(1000, "Nội dung đánh giá tối đa 1000 ký tự"),
});

export type FavoriteInput = z.infer<typeof favoriteSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
