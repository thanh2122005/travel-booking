import { Prisma, TourStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { demoTogglePublicFavorite } from "@/lib/demo/admin-demo-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { favoriteSchema } from "@/lib/validations/tour-interactions";

export async function POST(request: Request) {
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để sử dụng tính năng này.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

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

  const json = await parseJsonBody(request, "Dữ liệu yêu thích không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }
  const body = json.data;
  const parsed = favoriteSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: firstIssue?.message ?? "Dữ liệu không hợp lệ.",
      },
      { status: 400 },
    );
  }

  try {
    const tour = await db.tour.findUnique({
      where: { id: parsed.data.tourId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!tour || tour.status !== TourStatus.ACTIVE) {
      return NextResponse.json({ message: "Tour không tồn tại hoặc đã ngừng hoạt động." }, { status: 404 });
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
      await db.favorite.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        message: "Đã bỏ tour khỏi danh sách yêu thích.",
        isFavorite: false,
      });
    }

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
      {
        message: "Không thể cập nhật yêu thích lúc này, vui lòng thử lại sau.",
      },
      { status: 500 },
    );
  }
}
