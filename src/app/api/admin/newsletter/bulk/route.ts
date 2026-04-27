// TÓM TẮT API: src/app/api/admin/newsletter/bulk/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> parse body -> validate -> xóa hàng loạt.

import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { appendAdminActivityLog } from "@/lib/db/admin-activity-log";
import { deleteAdminNewsletterSubscribersBulk } from "@/lib/db/admin-engagement-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const newsletterBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(300),
});

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminApiAuth();
    if (auth.response) return auth.response;

    const json = await parseJsonBody(request, "Dữ liệu xóa đăng ký nhận tin không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }

    const parsed = newsletterBulkDeleteSchema.safeParse(json.data);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dữ liệu xóa không hợp lệ." }, { status: 400 });
    }

    const result = await deleteAdminNewsletterSubscribersBulk(parsed.data);
    if (result.count === 0) {
      return NextResponse.json({ message: "Không tìm thấy đăng ký nhận tin phù hợp để xóa." }, { status: 404 });
    }
    await appendAdminActivityLog({
      action: "NEWSLETTER_BULK_DELETED",
      actorId: auth.userId,
      actorName: auth.userName ?? "Quản trị viên",
      detail: {
        count: result.count,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      message: `Đã xóa ${result.count} email đăng ký nhận tin.`,
      count: result.count,
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}


