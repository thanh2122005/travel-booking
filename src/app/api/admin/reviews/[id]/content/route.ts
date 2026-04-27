// TÓM TẮT API: src/app/api/admin/reviews/[id]/content/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { updateAdminReviewContent } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const reviewContentUpdateSchema = z.object({
  rating: z.number().int().min(1, "Điểm đánh giá phải từ 1 đến 5.").max(5, "Điểm đánh giá phải từ 1 đến 5."),
  comment: z.string().trim().min(1, "Nội dung đánh giá là bắt buộc."),
  isVisible: z.boolean(),
});

type ReviewContentRouteContext = {
  params: Promise<{ id: string }>;
};

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: ReviewContentRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  const auth = await requireAdminApiAuth();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật nội dung đánh giá không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = reviewContentUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật đánh giá không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAdminReviewContent(id, parsed.data);
    await appendAdminActivityLog({
      action: "REVIEW_CONTENT_UPDATED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        reviewId: updated.id,
        rating: updated.rating,
        isVisible: updated.isVisible,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      message: "Đã cập nhật chi tiết đánh giá.",
      review: updated,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy đánh giá cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật đánh giá." }, { status: 500 });
  }
}








