"use server";

import { InquiryStatus, UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth/session";
import { updateAdminInquiryStatus } from "@/lib/db/admin-engagement-queries";

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  try {
    const session = await getAuthSession();
    if (
      !session?.user ||
      session.user.role !== UserRole.ADMIN ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      throw new Error("Không có quyền thực hiện.");
    }

    const updated = await updateAdminInquiryStatus(id, status);
    if (!updated) {
      throw new Error("Không tìm thấy yêu cầu tư vấn.");
    }

    revalidatePath("/admin/inquiries");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Đã có lỗi xảy ra. Vui lòng thử lại sau." };
  }
}
