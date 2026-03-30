import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { deleteAdminTourImage, updateAdminTourImage } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { optionalMediaUrlSchema } from "@/lib/validations/media-url";

const updateTourImageSchema = z.object({
  imageUrl: optionalMediaUrlSchema("URL ảnh không hợp lệ."),
  sortOrder: z.number().int().positive("Thứ tự ảnh phải lớn hơn 0.").optional(),
});

type TourImageByIdRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: TourImageByIdRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật ảnh tour không hợp lệ.");
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

  try {
    const updated = await updateAdminTourImage(id, parsed.data);
    return NextResponse.json({ message: "Đã cập nhật ảnh tour.", image: updated });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy ảnh tour cần cập nhật." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật ảnh tour." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: TourImageByIdRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;

  try {
    await deleteAdminTourImage(id);
    return NextResponse.json({ message: "Đã xóa ảnh tour." });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy ảnh tour cần xóa." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể xóa ảnh tour." }, { status: 500 });
  }
}