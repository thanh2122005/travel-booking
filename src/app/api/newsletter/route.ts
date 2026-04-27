// TÓM TẮT API: src/app/api/newsletter/route.ts
// Phạm vi: API public hoặc user đã đăng nhập.
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { saveNewsletterSubscriber, demoGetNewsletterSubscribers } from "@/lib/demo/newsletter-subscriber-store";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { newsletterSchema } from "@/lib/validations/newsletter";

// LUỒNG: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // BƯỚC 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // BƯỚC 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // BƯỚC 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Rate limit cho endpoint public đăng ký newsletter.
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:newsletter:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 20,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const parsed = newsletterSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Email không hợp lệ." },
      { status: 400 },
    );
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  try {
    // Lưu email dạng normalized để tránh trùng do khác hoa/thường.
    await db.newsletterSubscriber.create({
      data: { email: normalizedEmail },
    });

    return NextResponse.json(
      { message: "Đăng ký nhận tin thành công. Cảm ơn bạn đã theo dõi." },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // P2002: email đã tồn tại trong danh sách.
      return NextResponse.json({
        message: "Email này đã đăng ký nhận tin trước đó.",
      });
    }

    if (isDatabaseUnavailableError(error)) {
      const result = await saveNewsletterSubscriber(normalizedEmail);
      if (result.status === "EXISTED") {
        return NextResponse.json({
          message: "Email này đã đăng ký nhận tin trước đó.",
        });
      }

      return NextResponse.json(
        { message: "Đăng ký nhận tin thành công. Cảm ơn bạn đã theo dõi." },
        { status: 201 },
      );
    }

    console.error("Failed to save newsletter subscriber", error);
    return NextResponse.json(
      { message: "Không thể đăng ký nhận tin lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}

// LUỒNG: GET - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function GET() {
  // BƯỚC 1: Kiểm tra quyền truy cập (nếu endpoint có yêu cầu auth/admin).
  // BƯỚC 2: Đọc query params và chuẩn hóa bộ lọc/sắp xếp.
  // BƯỚC 3: Gọi service/DB để lấy dữ liệu hoặc tạo file export.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi phù hợp (400/401/403/404/500).
  try {
    // Endpoint đọc nhanh danh sách subscriber mới nhất.
    const subscribers = await db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subscribers);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const data = await demoGetNewsletterSubscribers({ pageSize: 500 });
      return NextResponse.json(data.items);
    }
    return NextResponse.json(
      { message: "Lỗi khi lấy danh sách đăng ký nhận tin." },
      { status: 500 },
    );
  }
}








