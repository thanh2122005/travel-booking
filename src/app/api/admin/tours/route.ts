// API Xử lý Thêm Tour Mới (Dành cho Admin).
// Validate dữ liệu chặt chẽ (giá, lịch trình, phòng đơn) trước khi ghi vào Database.

import { Prisma, TourStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaForeignKeyError } from "@/lib/db/db-error";
import { createAdminTour } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { requiredMediaUrlSchema } from "@/lib/validations/media-url";

const createTourSchema = z.object({
  // Nhóm trường thông tin cơ bản: Định nghĩa bắt buộc phải nhập các trường quan trọng (title, price, slug...).
  title: z.string().trim().min(1, "Tên tour là bắt buộc."),
  slug: z.string().trim().min(1, "Slug là bắt buộc."),
  shortDescription: z.string().trim().min(1, "Mô tả ngắn là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc."),
  price: z.number().int().positive("Giá tour phải lớn hơn 0."),
  discountPrice: z.number().int().positive().nullable().optional(),
  durationDays: z.number().int().positive("Số ngày phải lớn hơn 0."),
  durationNights: z.number().int().min(0, "Số đêm không hợp lệ."),
  singleRoomSurchargePerAdult: z.number().int().min(0, "Phụ thu phòng đơn không hợp lệ.").optional().default(0),
  maxGuests: z.number().int().positive("Số khách tối đa phải lớn hơn 0."),
  transportation: z.string().trim().min(1, "Phương tiện là bắt buộc."),
  departureLocation: z.string().trim().min(1, "Điểm khởi hành là bắt buộc."),
  featuredImage: requiredMediaUrlSchema("Ảnh nổi bật là bắt buộc."),
  images: z.array(z.string().trim()).optional().default([]),
  itineraries: z
    .array(
      z.object({
        dayNumber: z.number().int().positive("Ngày không hợp lệ."),
        title: z.string().trim().min(1, "Tiêu đề lịch trình là bắt buộc."),
        description: z.string().trim().min(1, "Mô tả lịch trình là bắt buộc."),
      }),
    )
    .optional()
    .default([]),
  status: z.nativeEnum(TourStatus).optional(),
  featured: z.boolean().optional(),
  locationId: z.string().trim().min(1, "Điểm đến là bắt buộc."),
}).superRefine((value, ctx) => {
  // Kiểm tra chéo (Cross-validation): Đảm bảo tour đi qua đêm (durationNights > 0) thì bắt buộc phải cấu hình phí phụ thu phòng đơn.
  if (value.durationNights > 0 && value.singleRoomSurchargePerAdult <= 0) {
    ctx.addIssue({
      code: "custom",
      path: ["singleRoomSurchargePerAdult"],
      message: "Tour có lưu trú phải cấu hình phụ thu phòng đơn lớn hơn 0.",
    });
  }
});

export async function POST(request: Request) {
  // Kiểm tra quyền (Auth Guard): Chỉ có tài khoản Admin mới được gọi API này để tạo tour mới.
  // Hàm requireAdminApi sẽ tự động xác thực token JWT, chặn mọi request từ User thường hoặc chưa đăng nhập.
  const guard = await requireAdminApi();
  if (guard) return guard;

  // Parse Body: Lấy và phân tích dữ liệu form do Admin gửi lên.
  const json = await parseJsonBody(request, "Dữ liệu tạo tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  // Validate dữ liệu: Kiểm tra dữ liệu có tuân thủ schema đã định nghĩa ở trên không (Zod).
  const parsed = createTourSchema.safeParse(json.data);
  if (!parsed.success) {
    // Trả lỗi kiểm tra hợp lệ đầu tiên để frontend hiển thị gọn và rõ.
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu tạo tour không hợp lệ." },
      { status: 400 },
    );
  }

  // Chuẩn hóa dữ liệu: Xóa khoảng trắng thừa (trim) và đánh lại số thứ tự ngày cho lịch trình (dayNumber).
  const normalized = {
    ...parsed.data,
    images: parsed.data.images.map((item) => item.trim()).filter(Boolean),
    itineraries: parsed.data.itineraries
      .map((item, index) => ({
        dayNumber: index + 1,
        title: item.title.trim(),
        description: item.description.trim(),
      }))
      .filter((item) => item.title && item.description),
  };

  // Kiểm tra nghiệp vụ: Tour bắt buộc phải có ít nhất 1 ngày lịch trình.
  if (!normalized.itineraries.length) {
    return NextResponse.json(
      { message: "Vui lòng thêm ít nhất 1 ngày lịch trình." },
      { status: 400 },
    );
  }

  try {
    // Lưu vào CSDL: Sử dụng Prisma query (được bọc trong service) để thêm mới tour cùng các quan hệ đi kèm (images, itineraries).
    const created = await createAdminTour(normalized);
    return NextResponse.json({ message: "Tạo tour thành công.", tour: created }, { status: 201 });
  } catch (error) {
    // Xử lý lỗi Prisma (P2002): Quản trị viên nhập trùng URL Slug (trường duy nhất).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Slug tour đã tồn tại. Vui lòng nhập slug khác." },
        { status: 409 },
      );
    }

    // Xử lý lỗi khóa ngoại (P2003): Điểm đến (locationId) truyền vào không tồn tại trong DB.
    if (isPrismaForeignKeyError(error)) {
      return NextResponse.json({ message: "Không tìm thấy điểm đến được chọn." }, { status: 404 });
    }

    // Lỗi hệ thống không xác định
    return NextResponse.json({ message: "Không thể tạo tour mới." }, { status: 500 });
  }
}
