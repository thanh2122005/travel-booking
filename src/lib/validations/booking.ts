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
  .max(30, "Ngay khoi hanh khong hop le")
  .refine((value) => {
    const trimmed = value.trim();
    if (!trimmed) return true;

    const selectedDate = parseDateInput(trimmed);
    if (!selectedDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "Ngay khoi hanh phai tu hom nay tro di")
  .optional()
  .or(z.literal(""));

export const bookingSchema = z
  .object({
    tourId: z.string().trim().min(1, "Thieu thong tin tour"),
    fullName: z
      .string()
      .trim()
      .min(2, "Ho va ten phai co it nhat 2 ky tu")
      .max(80, "Ho va ten khong hop le"),
    email: z
      .string()
      .trim()
      .min(1, "Email la bat buoc")
      .email("Email khong dung dinh dang")
      .toLowerCase(),
    phone: z
      .string()
      .trim()
      .min(8, "Số điện thoại phải có ít nhất 8 ký tự")
      .max(20, "So dien thoai khong hop le"),
    numberOfGuests: z
      .number({ message: "So luong khach khong hop le" })
      .int("So luong khach phai la so nguyen")
      .min(1, "So luong khach toi thieu la 1")
      .max(100, "So luong khach toi da cho mot don la 100"),
    guestsFrom8: z
      .number({ message: "So khach tu 8 tuoi tro len khong hop le" })
      .int("So khach tu 8 tuoi tro len phai la so nguyen")
      .min(1, "Can it nhat 1 khach tu 8 tuoi tro len")
      .max(100, "So khach tu 8 tuoi tro len khong hop le")
      .optional(),
    child5To7Guests: z
      .number({ message: "So khach tu 5 den 7 tuoi khong hop le" })
      .int("So khach tu 5 den 7 tuoi phai la so nguyen")
      .min(0, "So khach tu 5 den 7 tuoi khong hop le")
      .max(100, "So khach tu 5 den 7 tuoi khong hop le")
      .optional(),
    childUnder5Guests: z
      .number({ message: "So khach duoi 5 tuoi khong hop le" })
      .int("So khach duoi 5 tuoi phai la so nguyen")
      .min(0, "So khach duoi 5 tuoi khong hop le")
      .max(100, "So khach duoi 5 tuoi khong hop le")
      .optional(),
    roomType: z.enum(["DOUBLE", "SINGLE"]).optional(),
    note: z.string().trim().max(500, "Ghi chu toi da 500 ky tu").optional().or(z.literal("")),
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
          message: "Tong so khach khong khop voi co cau do tuoi.",
          path: ["numberOfGuests"],
        });
      }
    }
  });

export type BookingInput = z.infer<typeof bookingSchema>;
