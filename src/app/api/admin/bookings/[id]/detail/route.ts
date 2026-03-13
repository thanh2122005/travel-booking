import { BookingStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminBookingDetail } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const bookingDetailUpdateSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên là bắt buộc."),
  email: z.string().trim().email("Email không hợp lệ."),
  phone: z.string().trim().min(8, "Số điện thoại không hợp lệ."),
  numberOfGuests: z.number().int().positive("Số khách phải lớn hơn 0."),
  note: z.string().trim().nullable().optional(),
  departureDate: z.string().trim().nullable().optional(),
  paymentMethod: z.string().trim().min(1, "Phương thức thanh toán là bắt buộc."),
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

type BookingDetailRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: BookingDetailRouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const { id } = await context.params;
  const json = await parseJsonBody(request, "Dữ liệu cập nhật chi tiết booking không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }
  const body = json.data;
  const parsed = bookingDetailUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu cập nhật booking không hợp lệ." },
      { status: 400 },
    );
  }

  const departureDate =
    parsed.data.departureDate && parsed.data.departureDate.length
      ? new Date(parsed.data.departureDate)
      : null;
  if (departureDate && Number.isNaN(departureDate.getTime())) {
    return NextResponse.json({ message: "Ngày khởi hành không hợp lệ." }, { status: 400 });
  }

  const updated = await updateAdminBookingDetail(id, {
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    numberOfGuests: parsed.data.numberOfGuests,
    note: parsed.data.note ?? null,
    departureDate: departureDate ? departureDate.toISOString() : null,
    paymentMethod: parsed.data.paymentMethod,
    status: parsed.data.status,
    paymentStatus: parsed.data.paymentStatus,
  }).catch(() => null);

  if (!updated) {
    return NextResponse.json(
      { message: "Không thể cập nhật booking. Vui lòng kiểm tra số khách tối đa của tour." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    message: "Đã cập nhật chi tiết booking.",
    booking: updated,
  });
}
