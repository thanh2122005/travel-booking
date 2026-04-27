// TÓM TẮT API: src/app/api/admin/locations/[id]/gallery/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> parse body -> validate -> cập nhật gallery.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { isPrismaNotFoundError } from "@/lib/db/db-error";
import { updateAdminLocationGallery } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { requiredMediaUrlSchema } from "@/lib/validations/media-url";

const updateLocationGallerySchema = z.object({
  gallery: z.array(requiredMediaUrlSchema("URL ảnh không hợp lệ.")).min(1, "Gallery điểm đến phải có ít nhất 1 ảnh."),
});

type LocationGalleryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: LocationGalleryRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu gallery điểm đến không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = updateLocationGallerySchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu gallery không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAdminLocationGallery(id, parsed.data.gallery);
    if (!updated) {
      return NextResponse.json({ message: "Gallery điểm đến không hợp lệ." }, { status: 400 });
    }

    return NextResponse.json({
      message: "Đã cập nhật gallery điểm đến.",
      location: updated,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ message: "Không tìm thấy điểm đến cần cập nhật gallery." }, { status: 404 });
    }

    return NextResponse.json({ message: "Không thể cập nhật gallery điểm đến." }, { status: 500 });
  }
}


