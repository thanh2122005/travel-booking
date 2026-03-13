import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminLocationContent } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { requiredMediaUrlSchema } from "@/lib/validations/media-url";

const updateLocationContentSchema = z.object({
  name: z.string().trim().min(1, "Tên điểm đến là bắt buộc."),
  slug: z.string().trim().min(1, "Slug điểm đến là bắt buộc."),
  provinceOrCity: z.string().trim().min(1, "Tỉnh/thành phố là bắt buộc."),
  country: z.string().trim().min(1, "Quốc gia là bắt buộc."),
  shortDescription: z.string().trim().min(1, "Mô tả ngắn là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc."),
  imageUrl: requiredMediaUrlSchema("Ảnh đại diện là bắt buộc."),
  featured: z.boolean(),
});

type LocationContentRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: LocationContentRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật nội dung điểm đến không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = updateLocationContentSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật điểm đến không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAdminLocationContent(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ message: "Không thể cập nhật điểm đến." }, { status: 500 });
    }
    return NextResponse.json({
      message: "Đã cập nhật nội dung điểm đến.",
      location: updated,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Slug điểm đến đã tồn tại. Vui lòng chọn slug khác." },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: "Không thể cập nhật điểm đến." }, { status: 500 });
  }
}
