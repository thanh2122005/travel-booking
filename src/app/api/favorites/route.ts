// TÓM TẮT API: src/app/api/favorites/route.ts
// Phạm vi: API public hoặc user đã đăng nhập.
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import { Prisma, TourStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { demoRemovePublicFavorite, demoTogglePublicFavorite } from "@/lib/demo/admin-demo-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { favoriteSchema } from "@/lib/validations/tour-interactions";

// LUỒNG: POST - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function POST(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập và rate limit để chặn spam.
  // BƯỚC 2: Phân tích JSON/body và kiểm tra hợp lệ schema đầu vào.
  // BƯỚC 3: Thực thi nghiệp vụ tạo mới/cập nhật theo quy tắc hệ thống.
  // BƯỚC 4: Trả kết quả thành công hoặc thông điệp lỗi có cấu trúc rõ ràng.
  // Guard xác thực user trước khi cho phép thao tác favorite.
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để sử dụng tính năng này.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  // BƯỚC 2: Rate limit cho thao tác bật/tắt yêu thích.
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:favorite:toggle:${session.user.id}:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 60,
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

  // BƯỚC 3: Phân tích body + kiểm tra hợp lệ tourId.
  const json = await parseJsonBody(request, "Dữ liệu yêu thích không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = favoriteSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // BƯỚC 4: Kiểm tra tour còn ACTIVE trước khi cho favorite.
    // Chỉ cho favorite tour đang ACTIVE.
    const tour = await db.tour.findUnique({
      where: { id: parsed.data.tourId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!tour || tour.status !== TourStatus.ACTIVE) {
      return NextResponse.json(
        { message: "Tour không tồn tại hoặc đã ngừng hoạt động." },
        { status: 404 },
      );
    }

    const where = {
      userId_tourId: {
        userId: session.user.id,
        tourId: parsed.data.tourId,
      },
    };

    const existing = await db.favorite.findUnique({
      where,
      select: { id: true },
    });

    if (existing) {
      // BƯỚC 5A: Đã có thì xóa record -> bỏ yêu thích.
      // Đã có favorite thì toggle thành bỏ yêu thích.
      await db.favorite.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        message: "Đã bỏ tour khỏi danh sách yêu thích.",
        isFavorite: false,
      });
    }

    // BƯỚC 5B: Chưa có thì tạo record -> thêm yêu thích.
    // Chưa có favorite thì tạo mới.
    await db.favorite.create({
      data: {
        userId: session.user.id,
        tourId: parsed.data.tourId,
      },
    });

    return NextResponse.json({
      message: "Đã thêm tour vào danh sách yêu thích.",
      isFavorite: true,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const result = await demoTogglePublicFavorite({
        userId: session.user.id,
        tourId: parsed.data.tourId,
        email: session.user.email ?? undefined,
      });

      return NextResponse.json({
        message: result.isFavorite
          ? "Đã thêm tour vào danh sách yêu thích."
          : "Đã bỏ tour khỏi danh sách yêu thích.",
        isFavorite: result.isFavorite,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({
        message: "Tour đã có trong danh sách yêu thích.",
        isFavorite: true,
      });
    }

    return NextResponse.json(
      { message: "Không thể cập nhật yêu thích lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}

// LUỒNG: DELETE - kiểm tra quyền/kiểm tra hợp lệ trước, sau đó xử lý nghiệp vụ và trả response có cấu trúc rõ ràng.
export async function DELETE(request: Request) {
  // BƯỚC 1: Kiểm tra quyền truy cập để tránh xóa trái phép.
  // BƯỚC 2: Phân tích input cần thiết (id/body/query) và kiểm tra hợp lệ.
  // BƯỚC 3: Kiểm tra tồn tại + ràng buộc nghiệp vụ trước khi xóa.
  // BƯỚC 4: Xóa dữ liệu và trả kết quả/thông báo lỗi phù hợp.
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để sử dụng tính năng này.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  // BƯỚC 2: Rate limit cho thao tác xóa yêu thích.
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:favorite:remove:${session.user.id}:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 60,
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

  // BƯỚC 3: Phân tích body + kiểm tra hợp lệ tourId.
  const json = await parseJsonBody(request, "Dữ liệu yêu thích không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }

  const parsed = favoriteSchema.safeParse(json.data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    // BƯỚC 4: Tìm bản ghi favorite theo cặp (userId, tourId) rồi xóa.
    const existing = await db.favorite.findUnique({
      where: {
        userId_tourId: {
          userId: session.user.id,
          tourId: parsed.data.tourId,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Tour chưa có trong danh sách yêu thích.", isFavorite: false },
        { status: 404 },
      );
    }

    await db.favorite.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      message: "Đã bỏ tour khỏi danh sách yêu thích.",
      isFavorite: false,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const result = await demoRemovePublicFavorite({
        userId: session.user.id,
        tourId: parsed.data.tourId,
        email: session.user.email ?? undefined,
      });

      if (!result.removed) {
        return NextResponse.json(
          { message: "Tour chưa có trong danh sách yêu thích.", isFavorite: false },
          { status: 404 },
        );
      }

      return NextResponse.json({
        message: "Đã bỏ tour khỏi danh sách yêu thích.",
        isFavorite: false,
      });
    }

    return NextResponse.json(
      { message: "Không thể cập nhật yêu thích lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}








