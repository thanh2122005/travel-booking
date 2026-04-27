// TÓM TẮT API: src/app/api/account/profile/route.ts
// Phạm vi: API public hoặc user đã đăng nhập.
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";
import { demoUpdateUserContent } from "@/lib/demo/admin-demo-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { profileUpdateSchema } from "@/lib/validations/profile";

// LUỒNG: PATCH - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function PATCH(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập trước khi sửa dữ liệu.
  // BƯỚC 2: Phân tích body và kiểm tra hợp lệ các trường được phép cập nhật.
  // BƯỚC 3: Áp dụng quy tắc nghiệp vụ rồi cập nhật DB/lớp service.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi nghiệp vụ tương ứng.
  // Guard xác thực user trước khi cho phép cập nhật hồ sơ.
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để cập nhật hồ sơ.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  const ip = getClientIp(request);
  const rate = consumeRateLimit(`account:profile:update:${session.user.id}:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 20,
  });
  if (!rate.allowed) {
    // Trả Retry-After để frontend hiển thị chờ hợp lý.
    return NextResponse.json(
      { message: "Bạn cập nhật quá nhanh. Vui lòng thử lại sau." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const json = await parseJsonBody(request, "Dữ liệu cập nhật hồ sơ không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = profileUpdateSchema.safeParse(json.data);
  if (!parsed.success) {
    // Trả lỗi kiểm tra hợp lệ đầu tiên để thông báo ngắn gọn cho người dùng.
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Thông tin cập nhật không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // Chỉ cho cập nhật các trường cho phép (fullName, phone).
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({
      message: "Đã cập nhật hồ sơ cá nhân.",
      user: updated,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      // Dự phòng demo khi DB tạm không khả dụng.
      const updated = await demoUpdateUserContent(session.user.id, {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
      });

      if (!updated || updated === "LAST_ADMIN") {
        return NextResponse.json(
          { message: "Không thể cập nhật hồ sơ lúc này." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "Đã cập nhật hồ sơ cá nhân.",
        user: {
          id: updated.id,
          fullName: updated.fullName,
          email: updated.email,
          phone: updated.phone,
        },
      });
    }

    return NextResponse.json(
      { message: "Không thể cập nhật hồ sơ lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}








