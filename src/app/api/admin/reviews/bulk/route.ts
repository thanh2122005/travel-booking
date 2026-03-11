import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminReviewsBulk } from "@/lib/db/admin-queries";

const bulkReviewSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  isVisible: z.boolean(),
});

export async function PATCH(request: Request) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  try {
    const body = await request.json();
    const parsed = bulkReviewSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Dữ liệu cập nhật hàng loạt không hợp lệ." },
        { status: 400 },
      );
    }

    const updated = await updateAdminReviewsBulk(parsed.data).catch(() => null);
    if (!updated) {
      return NextResponse.json({ message: "Không thể cập nhật review hàng loạt." }, { status: 500 });
    }

    return NextResponse.json({
      message: `Đã cập nhật ${updated.count} review.`,
      count: updated.count,
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}
