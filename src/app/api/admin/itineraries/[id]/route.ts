import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { deleteAdminItinerary, updateAdminItinerary } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const updateItinerarySchema = z.object({
  dayNumber: z.number().int().positive("Ngày hành trình phải lớn hơn 0.").optional(),
  title: z.string().trim().min(1, "Tiêu đề không hợp lệ.").optional(),
  description: z.string().trim().min(1, "Mô tả không hợp lệ.").optional(),
});

type ItineraryByIdRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: ItineraryByIdRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Du lieu cap nhat lich trinh khong hop le.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = updateItinerarySchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật lịch trình không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAdminItinerary(id, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { message: "Không thể cập nhật lịch trình. Có thể bị trùng ngày." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Đã cập nhật lịch trình.", itinerary: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Ngày lịch trình đã tồn tại cho tour này." },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: "Không thể cập nhật lịch trình." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: ItineraryByIdRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const deleted = await deleteAdminItinerary(id).catch(() => null);
  if (!deleted) {
    return NextResponse.json({ message: "Không thể xóa lịch trình." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã xóa lịch trình." });
}
