import { TourStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminTour } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const createTourSchema = z.object({
  title: z.string().trim().min(1, "Tên tour là bắt buộc."),
  slug: z.string().trim().min(1, "Slug là bắt buộc."),
  shortDescription: z.string().trim().min(1, "Mô tả ngắn là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc."),
  price: z.number().int().positive("Giá tour phải lớn hơn 0."),
  discountPrice: z.number().int().positive().nullable().optional(),
  durationDays: z.number().int().positive("Số ngày phải lớn hơn 0."),
  durationNights: z.number().int().min(0, "Số đêm không hợp lệ."),
  maxGuests: z.number().int().positive("Số khách tối đa phải lớn hơn 0."),
  transportation: z.string().trim().min(1, "Phương tiện là bắt buộc."),
  departureLocation: z.string().trim().min(1, "Điểm khởi hành là bắt buộc."),
  featuredImage: z.string().trim().min(1, "Ảnh đại diện là bắt buộc."),
  status: z.nativeEnum(TourStatus).optional(),
  featured: z.boolean().optional(),
  locationId: z.string().trim().min(1, "Điểm đến là bắt buộc."),
});

export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const json = await parseJsonBody(request, "Du lieu tao tour khong hop le.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = createTourSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu tạo tour không hợp lệ." },
      { status: 400 },
    );
  }

  const created = await createAdminTour(parsed.data).catch(() => null);
  if (!created) {
    return NextResponse.json({ message: "Không thể tạo tour mới." }, { status: 500 });
  }

  return NextResponse.json({ message: "Tạo tour thành công.", tour: created }, { status: 201 });
}
