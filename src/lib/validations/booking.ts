import { z } from "zod";

const departureDateSchema = z
  .string()
  .trim()
  .max(30, "Ngày khởi hành không hợp lệ")
  .optional()
  .or(z.literal(""));

export const bookingSchema = z.object({
  tourId: z.string().trim().min(1, "Thiếu thông tin tour"),
  fullName: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(80, "Họ và tên không hợp lệ"),
  email: z
    .string()
    .trim()
    .min(1, "Email là bắt buộc")
    .email("Email không đúng định dạng")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(8, "Số điện thoại phải có ít nhất 8 ký tự")
    .max(20, "Số điện thoại không hợp lệ"),
  numberOfGuests: z
    .number({ message: "Số lượng khách không hợp lệ" })
    .int("Số lượng khách phải là số nguyên")
    .min(1, "Số lượng khách tối thiểu là 1")
    .max(20, "Số lượng khách tối đa là 20"),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional().or(z.literal("")),
  departureDate: departureDateSchema,
});

export type BookingInput = z.infer<typeof bookingSchema>;
