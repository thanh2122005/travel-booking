// API SUMMARY: src/app/api/admin/itineraries/[id]/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { deleteAdminItinerary, updateAdminItinerary } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const updateItinerarySchema = z.object({
  dayNumber: z.number().int().positive("Ngày hành trình phải lớn hơn 0.").optional(),
  title: z.string().trim().min(1, "Tiêu đề không hợp lệ.").optional(),
  description: z.string().trim().min(1, "Mô tả không hợp lệ.").optional(),
});

type ItineraryByIdRouteContext = {
  params: Promise<{ id: string }>;
};

// FLOW: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: ItineraryByIdRouteContext) {
  // STEP 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // STEP 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // STEP 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // STEP 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật lịch trình không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = updateItinerarySchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật lịch trình không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAdminItinerary(id, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { message: "Không thể cập nhật lịch trình. Có thể bị trùng ngày." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Đã cập nhật lịch trình.", itinerary: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Ngày lịch trình đã tồn tại cho tour này." },
        { status: 409 },
      );
    }

    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy lịch trình cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật lịch trình." }, { status: 500 });
  }
}

// FLOW: DELETE - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function DELETE(_request: Request, context: ItineraryByIdRouteContext) {
  // STEP 1: Kiểm tra quyền truy cập để tránh xóa trái phép.
  // STEP 2: Phân tích input cần thiết (id/body/query) và kiểm tra hợp lệ.
  // STEP 3: Kiểm tra tồn tại + ràng buộc nghiệp vụ trước khi xóa.
  // STEP 4: Xóa dữ liệu và trả kết quả/thông báo lỗi phù hợp.
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;

  try {
    await deleteAdminItinerary(id);
    return NextResponse.json({ message: "Đã xóa lịch trình." });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy lịch trình cần xóa." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể xóa lịch trình." }, { status: 500 });
  }
}

