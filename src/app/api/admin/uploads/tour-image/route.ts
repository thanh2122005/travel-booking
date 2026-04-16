// API SUMMARY: src/app/api/admin/uploads/tour-image/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// FLOW: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // STEP 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // STEP 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // STEP 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // STEP 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Chỉ admin mới được upload ảnh vào thư viện tour.
  const guard = await requireAdminApi();
  if (guard) return guard;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Chưa chọn ảnh để tải lên." }, { status: 400 });
    }

    // Validate MIME type để tránh upload file không phải ảnh.
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP." },
        { status: 400 },
      );
    }

    // Validate dung lượng để giới hạn tài nguyên server.
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Ảnh vượt quá giới hạn 5MB." },
        { status: 400 },
      );
    }

    const extension = EXTENSION_BY_TYPE[file.type] ?? ".jpg";
    const fileName = `tour-${Date.now()}-${randomUUID()}${extension}`;
    const relativeDir = "/immerse-vietnam/images/custom-tours";
    const publicDir = path.join(process.cwd(), "public", "immerse-vietnam", "images", "custom-tours");
    const absolutePath = path.join(publicDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    // Lưu ảnh vào thư mục public để Next/Image truy cập trực tiếp.
    await mkdir(publicDir, { recursive: true });
    await writeFile(absolutePath, buffer);

    return NextResponse.json(
      {
        message: "Tải ảnh thành công.",
        url: `${relativeDir}/${fileName}`,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Không thể tải ảnh lên lúc này." },
      { status: 500 },
    );
  }
}







