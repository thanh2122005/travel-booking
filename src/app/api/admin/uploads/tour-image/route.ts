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
  const guard = await requireAdminApi();
  if (guard) return guard;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Chưa chọn ảnh để tải lên." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP." },
        { status: 400 },
      );
    }

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