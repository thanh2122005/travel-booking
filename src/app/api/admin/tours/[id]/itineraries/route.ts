import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminItinerary } from "@/lib/db/admin-queries";

const createItinerarySchema = z.object({
  dayNumber: z.number().int().positive("Ngày hành trình phải lớn hơn 0."),
  title: z.string().trim().min(1, "Tiêu đề lịch trình là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả lịch trình là bắt buộc."),
});

type ItineraryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: ItineraryRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id: tourId } = await context.params;
  const body = await request.json();
  const parsed = createItinerarySchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu lịch trình không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const created = await createAdminItinerary({
      tourId,
      dayNumber: parsed.data.dayNumber,
      title: parsed.data.title,
      description: parsed.data.description,
    });

    if (!created) {
      return NextResponse.json(
        { message: "Không thể tạo lịch trình. Vui lòng kiểm tra trùng ngày." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Đã thêm lịch trình.",
        itinerary: created,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Ngày lịch trình đã tồn tại cho tour này." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Không thể thêm lịch trình." }, { status: 500 });
  }
}
