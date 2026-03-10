import { BookingStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminBooking } from "@/lib/db/admin-queries";

const bookingUpdateSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

type BookingRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: BookingRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = bookingUpdateSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật không hợp lệ." },
      { status: 400 },
    );
  }

  const updated = await updateAdminBooking(id, parsed.data).catch(() => null);
  if (!updated) {
    return NextResponse.json({ message: "Không thể cập nhật đơn đặt tour." }, { status: 500 });
  }

  return NextResponse.json({ message: "Đã cập nhật đơn đặt tour.", booking: updated });
}
