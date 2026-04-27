// TÓM TẮT API: src/app/api/admin/locations/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminLocation } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { requiredMediaUrlSchema } from "@/lib/validations/media-url";

const createLocationSchema = z.object({
  name: z.string().trim().min(1, "Tên điểm đến là bắt buộc."),
  slug: z.string().trim().min(1, "Slug là bắt buộc."),
  provinceOrCity: z.string().trim().min(1, "Tỉnh/Thành là bắt buộc."),
  country: z.string().trim().min(1, "Quốc gia là bắt buộc."),
  shortDescription: z.string().trim().min(1, "Mô tả ngắn là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc."),
  imageUrl: requiredMediaUrlSchema("Ảnh đại diện là bắt buộc."),
  featured: z.boolean().optional(),
});

// LUỒNG: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // BƯỚC 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // BƯỚC 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // BƯỚC 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  const guard = await requireAdminApi();
  if (guard) return guard;

  // BƯỚC 2: Parse JSON an toàn trước khi kiểm tra hợp lệ schema.
  const json = await parseJsonBody(request, "Dữ liệu tạo điểm đến không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  // BƯỚC 3: Validate field bắt buộc cho điểm đến (name/slug/location/...).
  const parsed = createLocationSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu tạo điểm đến không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // BƯỚC 4: Ghi dữ liệu qua lớp service để route không ôm logic DB.
    const created = await createAdminLocation(parsed.data);
    return NextResponse.json(
      { message: "Tạo điểm đến thành công.", location: created },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // P2002 = trùng unique key (ở đây thường là slug).
      return NextResponse.json(
        { message: "Slug điểm đến đã tồn tại. Vui lòng nhập slug khác." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Không thể tạo điểm đến mới." }, { status: 500 });
  }
}


