import { z } from "zod";

function parseDateInput(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

const departureDateSchema = z
  .string()
  .trim()
  .max(30, "Ngày khởi hành không hợp lệ")
  .refine((value) => {
    const trimmed = value.trim();
    if (!trimmed) return true;

    const selectedDate = parseDateInput(trimmed);
    if (!selectedDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "Ngày khởi hành phải từ hôm nay trở đi")
  .optional()
  .or(z.literal(""));

export const bookingSchema = z
  .object({
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
      .max(100, "Số lượng khách tối đa cho một đơn là 100"),
    guestsFrom8: z
      .number({ message: "Số khách từ 8 tuổi trở lên không hợp lệ" })
      .int("Số khách từ 8 tuổi trở lên phải là số nguyên")
      .min(1, "Cần ít nhất 1 khách từ 8 tuổi trở lên")
      .max(100, "Số khách từ 8 tuổi trở lên không hợp lệ")
      .optional(),
    child5To7Guests: z
      .number({ message: "Số khách từ 5 đến 7 tuổi không hợp lệ" })
      .int("Số khách từ 5 đến 7 tuổi phải là số nguyên")
      .min(0, "Số khách từ 5 đến 7 tuổi không hợp lệ")
      .max(100, "Số khách từ 5 đến 7 tuổi không hợp lệ")
      .optional(),
    childUnder5Guests: z
      .number({ message: "Số khách dưới 5 tuổi không hợp lệ" })
      .int("Số khách dưới 5 tuổi phải là số nguyên")
      .min(0, "Số khách dưới 5 tuổi không hợp lệ")
      .max(100, "Số khách dưới 5 tuổi không hợp lệ")
      .optional(),
    note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional().or(z.literal("")),
    departureDate: departureDateSchema,
  })
  .superRefine((value, ctx) => {
    if (
      typeof value.guestsFrom8 === "number" ||
      typeof value.child5To7Guests === "number" ||
      typeof value.childUnder5Guests === "number"
    ) {
      const from8 = value.guestsFrom8 ?? 0;
      const from5To7 = value.child5To7Guests ?? 0;
      const under5 = value.childUnder5Guests ?? 0;
      if (from8 + from5To7 + under5 !== value.numberOfGuests) {
        ctx.addIssue({
          code: "custom",
          message: "Tổng số khách không khớp với cơ cấu độ tuổi.",
          path: ["numberOfGuests"],
        });
      }
    }
  });

export type BookingInput = z.infer<typeof bookingSchema>;
