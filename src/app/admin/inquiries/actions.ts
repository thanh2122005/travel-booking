"use server";

import { InquiryStatus, UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth/session";
import { resolveAccessState } from "@/lib/auth/access-state";
import { updateAdminInquiryStatus } from "@/lib/db/admin-engagement-queries";

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      throw new Error("Vui lòng đăng nhập.");
    }

    const access = await resolveAccessState(session.user);
    if (access.status === UserStatus.BLOCKED) {
      throw new Error("Tài khoản của bạn đã bị khóa.");
    }

    if (access.role !== UserRole.ADMIN) {
      throw new Error("Không có quyền thực hiện.");
    }

    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new Error("Thiếu mã yêu cầu tư vấn.");
    }

    if (!Object.values(InquiryStatus).includes(status)) {
      throw new Error("Trạng thái xử lý không hợp lệ.");
    }

    const updated = await updateAdminInquiryStatus(normalizedId, status);
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
