// API SUMMARY: src/app/api/admin/tours/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma, TourStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaForeignKeyError } from "@/lib/db/db-error";
import { createAdminTour } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { requiredMediaUrlSchema } from "@/lib/validations/media-url";

const createTourSchema = z.object({
  // Nhóm trường bắt buộc để tạo tour có thể mở bán.
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
  if (value.durationNights > 0 && value.singleRoomSurchargePerAdult <= 0) {
    ctx.addIssue({
      code: "custom",
      path: ["singleRoomSurchargePerAdult"],
      message: "Tour có lưu trú phải cấu hình phụ thu phòng đơn lớn hơn 0.",
    });
  }
});

// FLOW: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // STEP 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // STEP 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // STEP 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // STEP 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Guard admin: chặn sớm request chưa đăng nhập hoặc không có quyền admin.
  const guard = await requireAdminApi();
  if (guard) return guard;

  // Phân tích body an toàn; nếu JSON sai format thì trả 400 theo một chuẩn chung.
  const json = await parseJsonBody(request, "Dữ liệu tạo tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = createTourSchema.safeParse(json.data);
  if (!parsed.success) {
    // Trả lỗi kiểm tra hợp lệ đầu tiên để frontend hiển thị gọn và rõ.
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu tạo tour không hợp lệ." },
      { status: 400 },
    );
  }

  const normalized = {
    // Chuẩn hóa string/array trước khi lưu để dữ liệu sạch hơn.
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

  if (!normalized.itineraries.length) {
    // Rule nghiệp vụ: tour bắt buộc có ít nhất 1 ngày lịch trình.
    return NextResponse.json(
      { message: "Vui lòng thêm ít nhất 1 ngày lịch trình." },
      { status: 400 },
    );
  }

  try {
    // Day logic ghi DB xuong lớp service để route dễ đọc/dễ test.
    const created = await createAdminTour(normalized);
    return NextResponse.json({ message: "Tạo tour thành công.", tour: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // P2002 = trùng unique key (thường là slug).
      return NextResponse.json(
        { message: "Slug tour đã tồn tại. Vui lòng nhập slug khác." },
        { status: 409 },
      );
    }

    if (isPrismaForeignKeyError(error)) {
      // locationId không tồn tại.
      return NextResponse.json({ message: "Không tìm thấy điểm đến được chọn." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể tạo tour mới." }, { status: 500 });
  }
}







