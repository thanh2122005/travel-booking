import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminReview } from "@/lib/db/admin-queries";

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
  const body = await request.json();
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
