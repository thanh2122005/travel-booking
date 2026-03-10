import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminLocation } from "@/lib/db/admin-queries";

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
  const body = await request.json();
  const parsed = locationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  const updated = await updateAdminLocation(id, parsed.data).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật điểm đến." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã cập nhật điểm đến.", location: updated });
}
