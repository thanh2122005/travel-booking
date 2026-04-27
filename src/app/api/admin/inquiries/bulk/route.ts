// TÓM TẮT API: src/app/api/admin/inquiries/bulk/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> parse body -> validate -> cập nhật trạng thái hàng loạt.

import { InquiryStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { updateAdminInquiriesBulk } from "@/lib/db/admin-engagement-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const bulkInquirySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  status: z.nativeEnum(InquiryStatus),
});

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminApiAuth();
    if (auth.response) return auth.response;

    const json = await parseJsonBody(request, "Dữ liệu cập nhật tư vấn hàng loạt không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }

    const parsed = bulkInquirySchema.safeParse(json.data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Dữ liệu cập nhật hàng loạt không hợp lệ." },
        { status: 400 },
      );
    }

    const updated = await updateAdminInquiriesBulk(parsed.data);
    if (updated.count === 0) {
      return NextResponse.json({ message: "Không tìm thấy yêu cầu tư vấn phù hợp để cập nhật." }, { status: 404 });
    }
    await appendAdminActivityLog({
      action: "INQUIRIES_BULK_UPDATED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        count: updated.count,
        status: parsed.data.status,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      message: `Đã cập nhật ${updated.count} yêu cầu tư vấn.`,
      count: updated.count,
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}


