import { InquiryStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminInquiriesBulk } from "@/lib/db/admin-engagement-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const bulkInquirySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  status: z.nativeEnum(InquiryStatus),
});

export async function PATCH(request: Request) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  try {
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

    const updated = await updateAdminInquiriesBulk(parsed.data).catch(() => null);
    if (!updated) {
      return NextResponse.json({ message: "Không thể cập nhật yêu cầu tư vấn hàng loạt." }, { status: 500 });
    }

    return NextResponse.json({
      message: `Đã cập nhật ${updated.count} yêu cầu tư vấn.`,
      count: updated.count,
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}
