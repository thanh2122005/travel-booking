// API Xử lý Upload Ảnh Tour (Admin Only).
// Chức năng: Cho phép quản trị viên tải ảnh lên máy chủ (local storage).
// Luồng xử lý: Xác thực Admin -> Parse Form Data -> Validate Định Dạng/Dung lượng -> Ghi file vào thư mục public.
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

export async function POST(request: Request) {
  // Phân quyền Quản trị (Auth Guard): Bắt buộc người dùng phải là Admin.
  // Tránh việc bị hacker gọi API liên tục làm đầy ổ cứng máy chủ (DDoS qua upload).
  const guard = await requireAdminApi();
  if (guard) return guard;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Chưa chọn ảnh để tải lên." }, { status: 400 });
    }

    // Bảo mật Upload (Validation): 
    // - Chỉ cho phép định dạng ảnh hợp lệ (whitelist) để chặn upload mã độc (.php, .exe).
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP." },
        { status: 400 },
      );
    }

    // - Giới hạn dung lượng tối đa (MAX_FILE_SIZE = 5MB) để bảo vệ tài nguyên máy chủ.
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

    // Ghi file vào ổ cứng (File System):
    // Sinh thư mục tự động nếu chưa có (`recursive: true`) và ghi nhị phân vào thư mục `public` để Next.js/trình duyệt có thể truy cập được ảnh tĩnh trực tiếp.
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








