import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { exportAdminReviews } from "@/lib/db/admin-queries";
import { toCsv } from "@/lib/utils/csv";

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

function parseVisibleFilter(value: string) {
  if (value === "visible") return true;
  if (value === "hidden") return false;
  return undefined;
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

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const search = normalizeParam(request.nextUrl.searchParams.get("search"));
  const isVisibleRaw = normalizeParam(request.nextUrl.searchParams.get("isVisible"));
  const createdFromRaw = normalizeParam(request.nextUrl.searchParams.get("createdFrom"));
  const createdToRaw = normalizeParam(request.nextUrl.searchParams.get("createdTo"));

  const items = await exportAdminReviews({
    search: search || undefined,
    isVisible: parseVisibleFilter(isVisibleRaw),
    createdFrom: parseDateAtBoundary(createdFromRaw, "start"),
    createdTo: parseDateAtBoundary(createdToRaw, "end"),
  }).catch(() => null);

  if (!items) {
    return NextResponse.json({ message: "Không thể xuất dữ liệu đánh giá lúc này." }, { status: 500 });
  }

  const rows: Array<Array<unknown>> = [
    ["Ngày tạo", "Người dùng", "Email", "Tour", "Điểm", "Hiển thị", "Nội dung"],
    ...items.map((item) => [
      formatDateTime(item.createdAt),
      item.user.fullName,
      item.user.email,
      item.tour.title,
      item.rating,
      item.isVisible ? "Đang hiển thị" : "Đã ẩn",
      item.comment,
    ]),
  ];

  const csv = `\uFEFF${toCsv(rows)}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFileName("review_admin")}"`,
      "Cache-Control": "no-store",
    },
  });
}
