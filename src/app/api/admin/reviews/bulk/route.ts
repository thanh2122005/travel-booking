// TÓM TẮT API: src/app/api/admin/reviews/bulk/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { updateAdminReviewsBulk } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const bulkReviewSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  isVisible: z.boolean(),
});

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  const auth = await requireAdminApiAuth();
  if (auth.response) return auth.response;

  try {
    const json = await parseJsonBody(request, "Dữ liệu cập nhật đánh giá hàng loạt không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }

    const parsed = bulkReviewSchema.safeParse(json.data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Dữ liệu cập nhật hàng loạt không hợp lệ." },
        { status: 400 },
      );
    }

    const updated = await updateAdminReviewsBulk(parsed.data);
    if (updated.count === 0) {
      return NextResponse.json({ message: "Không tìm thấy đánh giá phù hợp để cập nhật." }, { status: 404 });
    }
    await appendAdminActivityLog({
      action: "REVIEWS_BULK_UPDATED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        count: updated.count,
        isVisible: parsed.data.isVisible,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      message: `Đã cập nhật ${updated.count} đánh giá.`,
      count: updated.count,
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}








