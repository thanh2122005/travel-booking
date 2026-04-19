import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { markAdminBookingCheckedIn } from "@/lib/db/admin-queries";

type AdminBookingCheckInRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: AdminBookingCheckInRouteContext) {
  const guard = await requireAdminApiAuth();
  if (guard.response) return guard.response;

  const { id } = await context.params;

  try {
    const result = await markAdminBookingCheckedIn(id, guard.userId);
    if (result === "NOT_FOUND") {
      return NextResponse.json({ message: "Không tìm thấy đơn booking." }, { status: 404 });
    }
    if (result === "NOT_PAID") {
      return NextResponse.json(
        { message: "Chỉ có thể check-in khi đơn đã ở trạng thái đã thanh toán." },
        { status: 409 },
      );
    }
    if (result === "TICKET_NOT_ISSUED") {
      return NextResponse.json(
        { message: "Đơn chưa có vé/check-in code. Vui lòng phát hành vé trước." },
        { status: 409 },
      );
    }
    if (result === "ALREADY_CHECKED_IN") {
      return NextResponse.json(
        { message: "Đơn này đã được check-in trước đó." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: "Đã đánh dấu check-in thành công.",
      booking: result,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const detail = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ message: `Không thể check-in lúc này. Debug: ${detail}` }, { status: 500 });
    }
    return NextResponse.json({ message: "Không thể check-in lúc này." }, { status: 500 });
  }
}
