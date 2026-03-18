import { InquiryStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminInquiryStatus } from "@/lib/db/admin-engagement-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateInquirySchema = z.object({
  status: z.nativeEnum(InquiryStatus),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const guard = await requireAdminApi();
    if (guard) return guard;

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

    const updated = await updateAdminInquiryStatus(normalizedId, parsed.data.status).catch(() => null);

    if (!updated) {
      return NextResponse.json(
        { message: "Không tìm thấy hoặc không thể cập nhật yêu cầu tư vấn." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: parsed.data.status === "RESOLVED" ? "Đã đánh dấu đã xử lý." : "Đã chuyển về chờ xử lý.",
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}
