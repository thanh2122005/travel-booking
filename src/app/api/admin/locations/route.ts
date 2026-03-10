import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminLocation } from "@/lib/db/admin-queries";

const createLocationSchema = z.object({
  name: z.string().trim().min(1, "Tên điểm đến là bắt buộc."),
  slug: z.string().trim().min(1, "Slug là bắt buộc."),
  provinceOrCity: z.string().trim().min(1, "Tỉnh/Thành là bắt buộc."),
  country: z.string().trim().min(1, "Quốc gia là bắt buộc."),
  shortDescription: z.string().trim().min(1, "Mô tả ngắn là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc."),
  imageUrl: z.string().trim().min(1, "Ảnh đại diện là bắt buộc."),
  featured: z.boolean().optional(),
});

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const body = await request.json();
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu tạo điểm đến không hợp lệ." },
      { status: 400 },
    );
  }

  const created = await createAdminLocation(parsed.data).catch(() => null);
  if (!created) {
    return NextResponse.json({ message: "Không thể tạo điểm đến mới." }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Tạo điểm đến thành công.", location: created },
    { status: 201 },
  );
}
