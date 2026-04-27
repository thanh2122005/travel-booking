// TÓM TẮT API: src/app/api/admin/inquiries/[id]/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { InquiryStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { updateAdminInquiryStatus } from "@/lib/db/admin-engagement-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateInquirySchema = z.object({
  status: z.nativeEnum(InquiryStatus),
});

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request, context: RouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  try {
    const auth = await requireAdminApiAuth();
    if (auth.response) return auth.response;

    const { id } = await context.params;
    const normalizedId = id?.trim();

    if (!normalizedId) {
      return NextResponse.json({ message: "Thiếu mã yêu cầu tư vấn." }, { status: 400 });
    }

    const json = await parseJsonBody(request, "Dữ liệu cập nhật tư vấn không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }

    const parsed = updateInquirySchema.safeParse(json.data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Trạng thái xử lý không hợp lệ." },
        { status: 400 },
      );
    }

    const updated = await updateAdminInquiryStatus(normalizedId, parsed.data.status);

    if (!updated) {
      return NextResponse.json(
        { message: "Không tìm thấy yêu cầu tư vấn cần cập nhật." },
        { status: 404 },
      );
    }
    await appendAdminActivityLog({
      action: "INQUIRY_STATUS_UPDATED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        inquiryId: updated.id,
        referenceCode: updated.referenceCode,
        status: updated.status,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      message: parsed.data.status === "RESOLVED" ? "Đã đánh dấu đã xử lý." : "Đã chuyển về chờ xử lý.",
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}








