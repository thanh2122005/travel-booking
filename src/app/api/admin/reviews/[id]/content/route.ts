import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-api";
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

export async function PATCH(request: Request, context: ReviewContentRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

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