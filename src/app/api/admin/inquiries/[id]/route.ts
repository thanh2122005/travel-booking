import { InquiryStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { updateAdminInquiryStatus } from "@/lib/db/admin-engagement-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateInquirySchema = z.object({
  status: z.nativeEnum(InquiryStatus),
});

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  try {
    const { id } = await context.params;
    const normalizedId = id?.trim();

    if (!normalizedId) {
      return NextResponse.json({ message: "Thieu ma yeu cau tu van." }, { status: 400 });
    }

    const json = await parseJsonBody(request, "Du lieu cap nhat tu van khong hop le.");
    if (!json.ok) {
      return json.response;
    }

    const parsed = updateInquirySchema.safeParse(json.data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Trang thai xu ly khong hop le." },
        { status: 400 },
      );
    }

    const updated = await updateAdminInquiryStatus(normalizedId, parsed.data.status).catch(() => null);

    if (!updated) {
      return NextResponse.json({ message: "Khong the cap nhat yeu cau tu van." }, { status: 500 });
    }

    return NextResponse.json({
      message: parsed.data.status === "RESOLVED" ? "Da danh dau da xu ly." : "Da chuyen ve cho xu ly.",
    });
  } catch {
    return NextResponse.json({ message: "Khong the xu ly yeu cau luc nay." }, { status: 500 });
  }
}
