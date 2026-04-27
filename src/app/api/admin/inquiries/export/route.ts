// TÓM TẮT API: src/app/api/admin/inquiries/export/route.ts
// Phạm vi: API quản trị (admin).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { InquiryStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { exportAdminInquiries } from "@/lib/db/admin-engagement-queries";
import { toCsv } from "@/lib/utils/csv";

const statusValues: InquiryStatus[] = [InquiryStatus.PENDING, InquiryStatus.RESOLVED];

function normalizeParam(value: string | null) {
  return value?.trim() ?? "";
}

function parseDateAtBoundary(value: string, boundary: "start" | "end") {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  if (boundary === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildFileName(prefix: string) {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `${prefix}_${date}_${time}.csv`;
}

// LUỒNG: GET - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function GET(request: NextRequest) {
  // BƯỚC 1: Kiểm tra quyền truy cập (nếu endpoint có yêu cầu auth/admin).
  // BƯỚC 2: Đọc query params và chuẩn hóa bộ lọc/sắp xếp.
  // BƯỚC 3: Gọi service/DB để lấy dữ liệu hoặc tạo file export.
  // BƯỚC 4: Trả response thành công hoặc mã lỗi phù hợp (400/401/403/404/500).
  const guard = await requireAdminApi();
  if (guard) return guard;

  const search = normalizeParam(request.nextUrl.searchParams.get("search"));
  const statusRaw = normalizeParam(request.nextUrl.searchParams.get("status"));
  const createdFromRaw = normalizeParam(request.nextUrl.searchParams.get("createdFrom"));
  const createdToRaw = normalizeParam(request.nextUrl.searchParams.get("createdTo"));

  const status = statusValues.includes(statusRaw as InquiryStatus)
    ? (statusRaw as InquiryStatus)
    : undefined;

  let items: Awaited<ReturnType<typeof exportAdminInquiries>> | null = null;

  try {
    items = await exportAdminInquiries({
    search: search || undefined,
    status,
    createdFrom: parseDateAtBoundary(createdFromRaw, "start"),
    createdTo: parseDateAtBoundary(createdToRaw, "end"),
  });
  } catch {
    return NextResponse.json({ message: "Không thể xuất dữ liệu tư vấn lúc này." }, { status: 500 });
  }

  const rows: Array<Array<unknown>> = [
    [
      "Mã tham chiếu",
      "Ngày gửi",
      "Họ tên",
      "Email",
      "Số điện thoại",
      "Tour quan tâm",
      "Số khách",
      "Ngày khởi hành",
      "Trạng thái",
      "Nội dung",
    ],
    ...items.map((item) => [
      item.referenceCode,
      formatDateTime(item.createdAt),
      item.fullName,
      item.email,
      item.phone,
      item.tour?.title ?? "",
      item.numberOfGuests,
      formatDateTime(item.departureDate ?? null),
      item.status === "RESOLVED" ? "Đã xử lý" : "Chờ xử lý",
      item.message,
    ]),
  ];

  const csv = `\uFEFF${toCsv(rows)}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFileName("inquiry_admin")}"`,
      "Cache-Control": "no-store",
    },
  });
}








