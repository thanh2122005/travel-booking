import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminReview } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const reviewUpdateSchema = z.object({
  isVisible: z.boolean(),
});

type ReviewRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: ReviewRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Du lieu cap nhat review khong hop le.");
  if (!json.ok) {
    return json.response;
  }
  const body = json.data;
  const parsed = reviewUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  const updated = await updateAdminReview(id, parsed.data).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật đánh giá." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã cập nhật trạng thái đánh giá.", review: updated });
}
