import { UserRole, UserStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { adminLabels, exportAdminUsers } from "@/lib/db/admin-queries";
import { toCsv } from "@/lib/utils/csv";

const roleValues: UserRole[] = [UserRole.ADMIN, UserRole.USER];
const statusValues: UserStatus[] = [UserStatus.ACTIVE, UserStatus.BLOCKED];

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

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi();
  if (guard) return guard;

  const search = normalizeParam(request.nextUrl.searchParams.get("search"));
  const roleRaw = normalizeParam(request.nextUrl.searchParams.get("role"));
  const statusRaw = normalizeParam(request.nextUrl.searchParams.get("status"));
  const createdFromRaw = normalizeParam(request.nextUrl.searchParams.get("createdFrom"));
  const createdToRaw = normalizeParam(request.nextUrl.searchParams.get("createdTo"));

  const role = roleValues.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : undefined;
  const status = statusValues.includes(statusRaw as UserStatus) ? (statusRaw as UserStatus) : undefined;

  const items = await exportAdminUsers({
    search: search || undefined,
    role,
    status,
    createdFrom: parseDateAtBoundary(createdFromRaw, "start"),
    createdTo: parseDateAtBoundary(createdToRaw, "end"),
  }).catch(() => null);

  if (!items) {
    return NextResponse.json({ message: "Không thể xuất dữ liệu người dùng lúc này." }, { status: 500 });
  }

  const rows: Array<Array<unknown>> = [
    [
      "Ngày tạo",
      "Họ tên",
      "Email",
      "Số điện thoại",
      "Vai trò",
      "Trạng thái",
      "Đơn đặt",
      "Đánh giá",
      "Yêu thích",
    ],
    ...items.map((item) => [
      formatDateTime(item.createdAt),
      item.fullName,
      item.email,
      item.phone ?? "",
      adminLabels.userRole[item.role],
      adminLabels.userStatus[item.status],
      item._count.bookings,
      item._count.reviews,
      item._count.favorites,
    ]),
  ];

  const csv = `\uFEFF${toCsv(rows)}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFileName("user_admin")}"`,
      "Cache-Control": "no-store",
    },
  });
}
