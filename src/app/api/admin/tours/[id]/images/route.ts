import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminTourImage, reorderAdminTourImages } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { requiredMediaUrlSchema } from "@/lib/validations/media-url";

const createTourImageSchema = z.object({
  imageUrl: requiredMediaUrlSchema("URL ảnh là bắt buộc."),
  sortOrder: z.number().int().positive().optional(),
});

const reorderTourImagesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1, "ID ảnh không hợp lệ."),
        sortOrder: z.number().int().positive("Thứ tự ảnh phải lớn hơn 0."),
      }),
    )
    .min(1, "Danh sách ảnh cần sắp xếp không được để trống."),
});

type TourImageRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: TourImageRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id: tourId } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu thêm ảnh tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = createTourImageSchema.safeParse(json.data);

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

export async function PATCH(request: Request, context: TourImageRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id: tourId } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu sắp xếp ảnh tour không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = reorderTourImagesSchema.safeParse(json.data);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu sắp xếp ảnh không hợp lệ." },
      { status: 400 },
    );
  }

  const reordered = await reorderAdminTourImages(tourId, parsed.data.items).catch(() => null);
  if (!reordered) {
    return NextResponse.json({ message: "Không thể cập nhật thứ tự ảnh." }, { status: 500 });
  }

  return NextResponse.json({
    message: "Đã cập nhật thứ tự ảnh tour.",
    images: reordered,
  });
}
