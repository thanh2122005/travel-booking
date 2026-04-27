// TÓM TẮT API: src/app/api/admin/locations/[id]/content/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { updateAdminLocationContent } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { requiredMediaUrlSchema } from "@/lib/validations/media-url";

const updateLocationContentSchema = z.object({
  name: z.string().trim().min(1, "Tên điểm đến là bắt buộc."),
  slug: z.string().trim().min(1, "Slug điểm đến là bắt buộc."),
  provinceOrCity: z.string().trim().min(1, "Tỉnh/thành phố là bắt buộc."),
  country: z.string().trim().min(1, "Quốc gia là bắt buộc."),
  shortDescription: z.string().trim().min(1, "Mô tả ngắn là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc."),
  imageUrl: requiredMediaUrlSchema("Ảnh đại diện là bắt buộc."),
  featured: z.boolean(),
});

type LocationContentRouteContext = {
  params: Promise<{ id: string }>;
};

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: LocationContentRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  // Guard admin cho endpoint sửa nội dung location.
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật nội dung điểm đến không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = updateLocationContentSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật điểm đến không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // Delegate update sang admin-queries để gom logic DB một chỗ.
    const updated = await updateAdminLocationContent(id, parsed.data);
    return NextResponse.json({
      message: "Đã cập nhật nội dung điểm đến.",
      location: updated,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Slug location đã tồn tại.
      return NextResponse.json(
        { message: "Slug điểm đến đã tồn tại. Vui lòng chọn slug khác." },
        { status: 409 },
      );
    }

    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy điểm đến cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật điểm đến." }, { status: 500 });
  }
}









