import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminLocationGallery } from "@/lib/db/admin-queries";

const updateLocationGallerySchema = z.object({
  gallery: z
    .array(z.string().trim().min(1, "URL ảnh không hợp lệ."))
    .min(1, "Gallery điểm đến phải có ít nhất 1 ảnh."),
});

type LocationGalleryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: LocationGalleryRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateLocationGallerySchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu gallery không hợp lệ." },
      { status: 400 },
    );
  }

  const updated = await updateAdminLocationGallery(id, parsed.data.gallery).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật gallery điểm đến." }, { status: 500 });
  }

  return NextResponse.json({
    message: "Đã cập nhật gallery điểm đến.",
    location: updated,
  });
}
