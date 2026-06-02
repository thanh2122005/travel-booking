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

// TÓM TẮT LOGIC VALIDATE DỮ LIỆU ĐẶT TOUR
// Dùng thư viện `zod` để định nghĩa bộ quy tắc dữ liệu đầu vào (schema validation).
// Schema này dùng chung cho cả Client (hiển thị lỗi form trực tiếp) và Server (chống dữ liệu sai/độc hại đẩy vào API).
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
      .max(1000, "Số lượng khách tối đa cho một đơn là 1000"),
    guestsFrom8: z
      .number({ message: "Số khách từ 8 tuổi trở lên không hợp lệ" })
      .int("Số khách từ 8 tuổi trở lên phải là số nguyên")
      .min(1, "Cần ít nhất 1 khách từ 8 tuổi trở lên")
      .max(1000, "Số khách từ 8 tuổi trở lên không hợp lệ")
      .optional(),
    child5To7Guests: z
      .number({ message: "Số khách từ 5 đến 7 tuổi không hợp lệ" })
      .int("Số khách từ 5 đến 7 tuổi phải là số nguyên")
      .min(0, "Số khách từ 5 đến 7 tuổi không hợp lệ")
      .max(1000, "Số khách từ 5 đến 7 tuổi không hợp lệ")
      .optional(),
    childUnder5Guests: z
      .number({ message: "Số khách dưới 5 tuổi không hợp lệ" })
      .int("Số khách dưới 5 tuổi phải là số nguyên")
      .min(0, "Số khách dưới 5 tuổi không hợp lệ")
      .max(1000, "Số khách dưới 5 tuổi không hợp lệ")
      .optional(),
    pickupMethod: z.enum(["SELF_ARRIVAL", "NEED_PICKUP"]).default("SELF_ARRIVAL"),
    pickupLocation: z
      .string()
      .trim()
      .max(120, "Điểm đón tối đa 120 ký tự")
      .optional()
      .nullable()
      .transform((value) => value ?? ""),
    roomType: z.enum(["DOUBLE", "SINGLE"]).optional(),
    singleRoomGuests: z
      .number({ message: "Số khách ở phòng đơn không hợp lệ" })
      .int("Số khách ở phòng đơn phải là số nguyên")
      .min(0, "Số khách ở phòng đơn không hợp lệ")
      .max(1000, "Số khách ở phòng đơn không hợp lệ")
      .optional(),
    note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional().or(z.literal("")),
    departureDate: departureDateSchema,
  })
  // Xác thực chéo (Cross-field Validation): Kiểm tra logic nghiệp vụ phụ thuộc giữa nhiều trường dữ liệu.
  // Ví dụ: Tổng số khách người lớn + trẻ em phải bằng đúng số `numberOfGuests`.
  .superRefine((value, ctx) => {
    // 1. Kiểm tra cơ cấu độ tuổi: Đảm bảo khách không gian lận chọn số lượng trẻ em không khớp với tổng số khách.
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

    // 2. Validate điểm đón: Bắt buộc phải nhập "điểm đón" nếu chọn hình thức "Cần xe đưa đón".
    if (value.pickupMethod === "NEED_PICKUP" && !value.pickupLocation?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng nhập điểm đón mong muốn khi chọn cần hỗ trợ đón.",
        path: ["pickupLocation"],
      });
    }

    // 3. Validate phòng đơn: Phải nhập số lượng khách ở phòng đơn hợp lệ nếu đã tick chọn ở phòng riêng.
    if (value.roomType === "SINGLE") {
      const singleRoomGuests = value.singleRoomGuests ?? 0;
      if (singleRoomGuests < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Vui lòng nhập ít nhất 1 khách ở phòng đơn.",
          path: ["singleRoomGuests"],
        });
      }
      if (singleRoomGuests > value.numberOfGuests) {
        ctx.addIssue({
          code: "custom",
          message: "Số khách ở phòng đơn không được vượt quá tổng số khách.",
          path: ["singleRoomGuests"],
        });
      }
    }
  });

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingPayload = z.output<typeof bookingSchema>;
