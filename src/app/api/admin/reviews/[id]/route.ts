// TÓM TẮT API: src/app/api/admin/reviews/[id]/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { updateAdminReview } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const reviewUpdateSchema = z.object({
  isVisible: z.boolean(),
});

type ReviewRouteContext = {
  params: Promise<{ id: string }>;
};

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: ReviewRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  const auth = await requireAdminApiAuth();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật review không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = reviewUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  try {
    // Toggle trạng thái hiển thị review (ẩn/hiện ngoài public).
    const updated = await updateAdminReview(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ message: "Không tìm thấy đánh giá cần cập nhật." }, { status: 404 });
    }
    await appendAdminActivityLog({
      action: "REVIEW_VISIBILITY_UPDATED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        reviewId: updated.id,
        isVisible: updated.isVisible,
      },
    }).catch(() => undefined);

    return NextResponse.json({ message: "Đã cập nhật trạng thái đánh giá.", review: updated });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy đánh giá cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật đánh giá." }, { status: 500 });
  }
}


