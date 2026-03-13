import { BookingStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminBookingsBulk } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const bulkBookingSchema = z
  .object({
    ids: z.array(z.string().min(1)).min(1).max(200),
    status: z.nativeEnum(BookingStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  })
  .refine((value) => value.status || value.paymentStatus, {
    message: "Vui lòng chọn ít nhất một trường cập nhật.",
    path: ["status"],
  });

export async function PATCH(request: Request) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  try {
    const json = await parseJsonBody(request, "Du lieu cap nhat booking hang loat khong hop le.");
    if (!json.ok) {
      return json.response;
    }
    const body = json.data;
    const parsed = bulkBookingSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Dữ liệu cập nhật hàng loạt không hợp lệ." },
        { status: 400 },
      );
    }

    const updated = await updateAdminBookingsBulk(parsed.data).catch(() => null);
    if (!updated) {
      return NextResponse.json({ message: "Không thể cập nhật booking hàng loạt." }, { status: 500 });
    }

    return NextResponse.json({
      message: `Đã cập nhật ${updated.count} booking.`,
      count: updated.count,
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}
