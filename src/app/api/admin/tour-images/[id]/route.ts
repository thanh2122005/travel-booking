import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { deleteAdminTourImage, updateAdminTourImage } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const updateTourImageSchema = z.object({
  imageUrl: z.string().trim().min(1, "URL ảnh không hợp lệ.").optional(),
  sortOrder: z.number().int().positive("Thứ tự ảnh phải lớn hơn 0.").optional(),
});

type TourImageByIdRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: TourImageByIdRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Du lieu cap nhat anh tour khong hop le.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = updateTourImageSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật ảnh không hợp lệ." },
      { status: 400 },
    );
  }

  const updated = await updateAdminTourImage(id, parsed.data).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật ảnh tour." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã cập nhật ảnh tour.", image: updated });
}

export async function DELETE(_request: Request, context: TourImageByIdRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const deleted = await deleteAdminTourImage(id).catch(() => null);
  if (!deleted) {
    return NextResponse.json({ message: "Không thể xóa ảnh tour." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã xóa ảnh tour." });
}
