// TÓM TẮT API: src/app/api/admin/tours/[id]/itineraries/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { createAdminItinerary } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const createItinerarySchema = z.object({
  dayNumber: z.number().int().positive("Ngày hành trình phải lớn hơn 0."),
  title: z.string().trim().min(1, "Tiêu đề lịch trình là bắt buộc."),
  description: z.string().trim().min(1, "Mô tả lịch trình là bắt buộc."),
});

type ItineraryRouteContext = {
  params: Promise<{ id: string }>;
};

// LUỒNG: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request, context: ItineraryRouteContext) {
  // BƯỚC 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // BƯỚC 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // BƯỚC 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // BƯỚC 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id: tourId } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu tạo lịch trình không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = createItinerarySchema.safeParse(json.data);

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








