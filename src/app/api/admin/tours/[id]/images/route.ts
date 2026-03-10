import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminTourImage } from "@/lib/db/admin-queries";

const createTourImageSchema = z.object({
  imageUrl: z.string().trim().min(1, "URL ảnh là bắt buộc."),
  sortOrder: z.number().int().positive().optional(),
});

type TourImageRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: TourImageRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id: tourId } = await context.params;
  const body = await request.json();
  const parsed = createTourImageSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu ảnh tour không hợp lệ." },
      { status: 400 },
    );
  }

  const created = await createAdminTourImage({
    tourId,
    imageUrl: parsed.data.imageUrl,
    sortOrder: parsed.data.sortOrder,
  }).catch(() => null);

  if (!created) {
    return NextResponse.json({ message: "Không thể thêm ảnh tour." }, { status: 500 });
  }

  return NextResponse.json(
    {
      message: "Đã thêm ảnh tour.",
      image: created,
    },
    { status: 201 },
  );
}
