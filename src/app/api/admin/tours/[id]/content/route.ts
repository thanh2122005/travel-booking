// TÓM TẮT API: src/app/api/admin/tours/[id]/content/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma, TourStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { updateAdminTourContent } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { requiredMediaUrlSchema } from "@/lib/validations/media-url";

const updateTourContentSchema = z.object({
  title: z.string().trim().min(1, "Tên tour là bắt buộc."),
  slug: z.string().trim().min(1, "Slug tour là bắt buộc."),
  shortDescription: z.string().trim().min(1, "Mô tả ngắn là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc."),
  price: z.number().int().positive("Giá tour phải lớn hơn 0."),
  discountPrice: z.number().int().positive().nullable(),
  durationDays: z.number().int().positive("Số ngày phải lớn hơn 0."),
  durationNights: z.number().int().min(0, "Số đêm không hợp lệ."),
  singleRoomSurchargePerAdult: z.number().int().min(0, "Phụ thu phòng đơn không hợp lệ."),
  maxGuests: z.number().int().positive("Số khách tối đa phải lớn hơn 0."),
  transportation: z.string().trim().min(1, "Phương tiện là bắt buộc."),
  departureLocation: z.string().trim().min(1, "Điểm khởi hành là bắt buộc."),
  featuredImage: requiredMediaUrlSchema("Ảnh đại diện là bắt buộc."),
  locationId: z.string().trim().min(1, "Điểm đến là bắt buộc."),
  status: z.nativeEnum(TourStatus),
  featured: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.durationNights > 0 && value.singleRoomSurchargePerAdult <= 0) {
    ctx.addIssue({
      code: "custom",
      path: ["singleRoomSurchargePerAdult"],
      message: "Tour có lưu trú phải cấu hình phụ thu phòng đơn lớn hơn 0.",
    });
  }
});

type TourContentRouteContext = {
  params: Promise<{ id: string }>;
};

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: TourContentRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  // Guard admin cho màn chỉnh sửa nội dung tour.
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật nội dung tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = updateTourContentSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật tour không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // Route chỉ kiểm tra hợp lệ + map lại; logic update nằm trong lớp service.
    const updated = await updateAdminTourContent(id, parsed.data);
    return NextResponse.json({
      message: "Đã cập nhật nội dung tour.",
      tour: updated,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Slug trùng unique.
      return NextResponse.json(
        { message: "Slug tour đã tồn tại. Vui lòng chọn slug khác." },
        { status: 409 },
      );
    }

    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy tour cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật nội dung tour." }, { status: 500 });
  }
}









