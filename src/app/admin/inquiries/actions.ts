"use server";

import { revalidatePath } from "next/cache";
import { UserRole, UserStatus } from "@prisma/client";
import { getAuthSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export async function markInquiryResolved(id: string) {
  try {
    const session = await getAuthSession();
    if (
      !session?.user ||
      session.user.role !== UserRole.ADMIN ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      throw new Error("Không có quyền thực hiện.");
    }

    await db.contactInquiry.update({
      where: { id },
      data: { status: "RESOLVED" },
    });

    revalidatePath("/admin/inquiries");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Đã có lỗi xảy ra. Vui lòng thử lại sau." };
  }
}
