import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { deleteAdminLocation, updateAdminLocation } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const locationUpdateSchema = z.object({
  featured: z.boolean(),
});

type LocationRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: LocationRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật điểm đến không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = locationUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  const updated = await updateAdminLocation(id, parsed.data).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật điểm đến." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã cập nhật điểm đến.", location: updated });
}

export async function DELETE(_request: Request, context: LocationRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const removed = await deleteAdminLocation(id).catch(() => null);

  if (removed === "HAS_TOURS") {
    return NextResponse.json(
      { message: "Không thể xóa điểm đến đang có tour. Vui lòng xử lý tour trước." },
      { status: 400 },
    );
  }

  if (!removed) {
    return NextResponse.json({ message: "Không thể xóa điểm đến." }, { status: 500 });
  }

  return NextResponse.json({
    message: "Đã xóa điểm đến thành công.",
    location: removed,
  });
}
