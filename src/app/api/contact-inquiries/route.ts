// TÓM TẮT API: src/app/api/contact-inquiries/route.ts
// Phạm vi: API public hoặc user đã đăng nhập.
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { saveContactInquiry, demoGetContactInquiries } from "@/lib/demo/contact-inquiry-store";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { contactInquirySchema } from "@/lib/validations/contact";

function buildReferenceCode() {
  // Mã tư vấn để CSKH tra cứu nhanh theo ngày.
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TV${yy}${mm}${dd}${random}`;
}

async function createContactInquiryWithRetry(data: {
  fullName: string;
  phone: string;
  email: string;
  tourId?: string;
  departureDate?: string;
  numberOfGuests: number;
  message: string;
}) {
  // Retry khi trùng referenceCode (unique) để tăng tỉ lệ thành công.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await db.contactInquiry.create({
        data: {
          referenceCode: buildReferenceCode(),
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          tourId: data.tourId,
          departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
          numberOfGuests: data.numberOfGuests,
          message: data.message,
        },
      });
    } catch (error) {
      const isDuplicateCode =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("referenceCode");
      if (isDuplicateCode) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Không thể tạo mã tham chiếu mới cho yêu cầu tư vấn.");
}

// LUỒNG: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // BƯỚC 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // BƯỚC 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // BƯỚC 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Rate limit theo IP cho form liên hệ công khai.
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:contact-inquiry:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 10,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút." },
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

  const parsed = contactInquirySchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Thông tin tư vấn không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // Tạo inquiry trong DB và trả mã tham chiếu cho người dùng.
    const inquiry = await createContactInquiryWithRetry(parsed.data);
    return NextResponse.json(
      {
        message: "Đã nhận yêu cầu tư vấn. Đội ngũ sẽ liên hệ với bạn sớm nhất có thể.",
        referenceCode: inquiry.referenceCode,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      // Dự phòng: lưu tạm vào demo store khi DB lỗi.
      const inquiry = await saveContactInquiry(parsed.data);
      return NextResponse.json(
        {
          message: "Đã nhận yêu cầu tư vấn. Đội ngũ sẽ liên hệ với bạn sớm nhất có thể.",
          referenceCode: inquiry.referenceCode,
        },
        { status: 201 },
      );
    }

    console.error("Failed to save contact inquiry", error);
    return NextResponse.json(
      { message: "Không thể gửi yêu cầu lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}

// LUỒNG: GET - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function GET() {
  // Chỉ admin mới được truy cập danh sách inquiry.
  const adminResponse = await requireAdminApi();
  if (adminResponse) {
    return adminResponse;
  }

  try {
    const inquiries = await db.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      include: { tour: { select: { title: true } } },
    });
    return NextResponse.json(inquiries);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const data = await demoGetContactInquiries({ pageSize: 500 });
      return NextResponse.json(data.items);
    }
    return NextResponse.json(
      { message: "Lỗi khi lấy danh sách yêu cầu tư vấn." },
      { status: 500 },
    );
  }
}








