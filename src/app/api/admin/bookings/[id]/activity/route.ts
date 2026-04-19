import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { getAdminBookingActivityLogs } from "@/lib/db/admin-queries";

type AdminBookingActivityRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: AdminBookingActivityRouteContext) {
  const guard = await requireAdminApiAuth();
  if (guard.response) return guard.response;

  const { id } = await context.params;
  try {
    const items = await getAdminBookingActivityLogs(id);
    return NextResponse.json({ items });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const detail = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ message: `Không thể tải nhật ký hoạt động. Debug: ${detail}` }, { status: 500 });
    }
    return NextResponse.json({ message: "Không thể tải nhật ký hoạt động." }, { status: 500 });
  }
}
