// API SUMMARY: src/app/api/admin/users/bulk/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/auth/admin-api";
import { updateAdminUsersBulk } from "@/lib/db/admin-queries";
import { parseJsonBody } from "@/lib/http/parse-json-body";

const userBulkUpdateSchema = z
  .object({
    ids: z.array(z.string().min(1)).min(1).max(300),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  })
  .refine((value) => value.role || value.status, {
    message: "Vui lòng chọn ít nhất một trường cập nhật.",
  });

// FLOW: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request) {
  // STEP 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // STEP 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // STEP 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // STEP 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  try {
    // Guard + userId hiện tại để xử lý rule an toàn cho admin.
    const auth = await requireAdminApiAuth();
    if (auth.response) return auth.response;

    // Phân tích body theo helper dùng chung cho API.
    const json = await parseJsonBody(request, "Dữ liệu cập nhật hàng loạt người dùng không hợp lệ.");
    if (!json.ok) {
      return json.response;
    }

    const parsed = userBulkUpdateSchema.safeParse(json.data);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Dữ liệu cập nhật không hợp lệ." },
        { status: 400 },
      );
    }

    if (
      parsed.data.ids.includes(auth.userId ?? "") &&
      ((parsed.data.role && parsed.data.role !== UserRole.ADMIN) || parsed.data.status === UserStatus.BLOCKED)
    ) {
      // Chặn admin tự khóa/tự hạ quyền bằng bulk update.
      return NextResponse.json(
        { message: "Không thể tự hạ quyền hoặc tự khóa tài khoản quản trị trong cập nhật hàng loạt." },
        { status: 400 },
      );
    }

    // Giao logic DB cho lớp service để route gọn và nhất quán.
    const result = await updateAdminUsersBulk(parsed.data);

    if (result === "LAST_ADMIN") {
      return NextResponse.json(
        { message: "Không thể hạ quyền hoặc khóa quản trị viên cuối cùng của hệ thống." },
        { status: 400 },
      );
    }

    if (result.count === 0) {
      return NextResponse.json({ message: "Không tìm thấy người dùng phù hợp để cập nhật." }, { status: 404 });
    }

    return NextResponse.json({
      // count trả về để UI cập nhật nhanh mà không cần query phụ.
      message: `Đã cập nhật ${result.count} người dùng.`,
      count: result.count,
    });
  } catch {
    return NextResponse.json({ message: "Không thể xử lý yêu cầu lúc này." }, { status: 500 });
  }
}







