import { TourStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { deleteAdminTour, updateAdminTour } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const tourUpdateSchema = z.object({
  status: z.nativeEnum(TourStatus).optional(),
  featured: z.boolean().optional(),
});

type TourRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: TourRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Du lieu cap nhat tour khong hop le.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = tourUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  const updated = await updateAdminTour(id, parsed.data).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật tour." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã cập nhật tour.", tour: updated });
}

export async function DELETE(_request: Request, context: TourRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const removed = await deleteAdminTour(id).catch(() => null);
  if (!removed) {
    return NextResponse.json({ message: "Không thể xóa tour." }, { status: 500 });
  }

  return NextResponse.json({
    message: "Đã xóa tour thành công.",
    tour: removed,
  });
}
