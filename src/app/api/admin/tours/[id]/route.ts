// API SUMMARY: src/app/api/admin/tours/[id]/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { TourStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { deleteAdminTour, updateAdminTour } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const tourUpdateSchema = z.object({
  status: z.nativeEnum(TourStatus).optional(),
  featured: z.boolean().optional(),
});

type TourRouteContext = {
  params: Promise<{ id: string }>;
};

// FLOW: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: TourRouteContext) {
  // STEP 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // STEP 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // STEP 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // STEP 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  // Admin guard cho thao tác cập nhật.
  const guard = await requireAdminApi();
  if (guard) return guard;

  // id lấy từ dynamic route /api/admin/tours/[id].
  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = tourUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  try {
    // Chỉ cập nhật trạng thái/featured ở endpoint này.
    const updated = await updateAdminTour(id, parsed.data);
    return NextResponse.json({ message: "Đã cập nhật tour.", tour: updated });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy tour cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật tour." }, { status: 500 });
  }
}

// FLOW: DELETE - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function DELETE(_request: Request, context: TourRouteContext) {
  // STEP 1: Kiểm tra quyền truy cập để tránh xóa trái phép.
  // STEP 2: Phân tích input cần thiết (id/body/query) và kiểm tra hợp lệ.
  // STEP 3: Kiểm tra tồn tại + ràng buộc nghiệp vụ trước khi xóa.
  // STEP 4: Xóa dữ liệu và trả kết quả/thông báo lỗi phù hợp.
  // Admin guard cho thao tác xóa.
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;

  try {
    // Xóa tour theo id, bao gồm dữ liệu liên quan theo logic service.
    const removed = await deleteAdminTour(id);
    if (removed === "HAS_BOOKINGS") {
      return NextResponse.json(
        {
          message:
            "Không thể xóa tour vì đã phát sinh đơn đặt. Vui lòng chuyển tour sang trạng thái 'Ngừng hoạt động'.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: "Đã xóa tour thành công.",
      tour: removed,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy tour cần xóa." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể xóa tour." }, { status: 500 });
  }
}







