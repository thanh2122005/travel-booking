import { Prisma, TourStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminTourContent } from "@/lib/db/admin-queries";

const updateTourContentSchema = z.object({
  title: z.string().trim().min(1, "Tên tour là bắt buộc."),
  slug: z.string().trim().min(1, "Slug tour là bắt buộc."),
  shortDescription: z.string().trim().min(1, "Mô tả ngắn là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả chi tiết là bắt buộc."),
  price: z.number().int().positive("Giá tour phải lớn hơn 0."),
  discountPrice: z.number().int().positive().nullable(),
  durationDays: z.number().int().positive("Số ngày phải lớn hơn 0."),
  durationNights: z.number().int().min(0, "Số đêm không hợp lệ."),
  maxGuests: z.number().int().positive("Số khách tối đa phải lớn hơn 0."),
  transportation: z.string().trim().min(1, "Phương tiện là bắt buộc."),
  departureLocation: z.string().trim().min(1, "Điểm khởi hành là bắt buộc."),
  featuredImage: z.string().trim().min(1, "Ảnh đại diện là bắt buộc."),
  locationId: z.string().trim().min(1, "Điểm đến là bắt buộc."),
  status: z.nativeEnum(TourStatus),
  featured: z.boolean(),
});

type TourContentRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: TourContentRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateTourContentSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật tour không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateAdminTourContent(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ message: "Không thể cập nhật nội dung tour." }, { status: 500 });
    }
    return NextResponse.json({
      message: "Đã cập nhật nội dung tour.",
      tour: updated,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Slug tour đã tồn tại. Vui lòng chọn slug khác." },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: "Không thể cập nhật nội dung tour." }, { status: 500 });
  }
}
