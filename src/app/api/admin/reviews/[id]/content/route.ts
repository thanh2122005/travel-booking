import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminReviewContent } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const reviewContentUpdateSchema = z.object({
  rating: z.number().int().min(1, "Rating phải từ 1 đến 5.").max(5, "Rating phải từ 1 đến 5."),
  comment: z.string().trim().min(1, "Nội dung đánh giá là bắt buộc."),
  isVisible: z.boolean(),
});

type ReviewContentRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: ReviewContentRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật nội dung review không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }
  const body = json.data;
  const parsed = reviewContentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật review không hợp lệ." },
      { status: 400 },
    );
  }

  const updated = await updateAdminReviewContent(id, parsed.data).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật review." }, { status: 500 });
  }

  return NextResponse.json({
    message: "Đã cập nhật chi tiết review.",
    review: updated,
  });
}
