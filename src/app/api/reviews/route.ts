import { BookingStatus, TourStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { demoDeletePublicReview, demoUpsertPublicReview } from "@/lib/demo/admin-demo-store";
import { requireActiveUserApi } from "@/lib/auth/user-api";
import { db } from "@/lib/db/prisma";
import { parseJsonBody } from "@/lib/http/parse-json-body";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { favoriteSchema, reviewSchema } from "@/lib/validations/tour-interactions";

export async function POST(request: Request) {
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để gửi đánh giá.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:review:upsert:${session.user.id}:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 20,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Bạn gửi đánh giá quá nhanh. Vui lòng thử lại sau." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const json = await parseJsonBody(request, "Dữ liệu đánh giá không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }
  const body = json.data;
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: firstIssue?.message ?? "Dữ liệu đánh giá không hợp lệ.",
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

    const confirmedBookingCount = await db.booking.count({
      where: {
        userId: session.user.id,
        tourId: parsed.data.tourId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        },
      },
    });

    if (!confirmedBookingCount) {
      return NextResponse.json(
        {
          message: "Bạn cần có đơn đã xác nhận hoặc đã hoàn thành để đánh giá tour này.",
        },
        { status: 403 },
      );
    }

    const review = await db.review.upsert({
      where: {
        userId_tourId: {
          userId: session.user.id,
          tourId: parsed.data.tourId,
        },
      },
      update: {
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        isVisible: true,
      },
      create: {
        userId: session.user.id,
        tourId: parsed.data.tourId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        isVisible: true,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Đánh giá của bạn đã được ghi nhận.",
      review,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const review = await demoUpsertPublicReview({
        userId: session.user.id,
        tourId: parsed.data.tourId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        email: session.user.email ?? undefined,
      });
      return NextResponse.json({
        message: "Đánh giá của bạn đã được ghi nhận.",
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          updatedAt: new Date(review.updatedAt),
        },
      });
    }

    return NextResponse.json(
      {
        message: "Không thể gửi đánh giá lúc này, vui lòng thử lại sau.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await requireActiveUserApi({
    unauthorizedMessage: "Vui lòng đăng nhập để xóa đánh giá.",
  });
  if (guard.response) {
    return guard.response;
  }
  const session = guard.session;

  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:review:delete:${session.user.id}:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 30,
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

  const json = await parseJsonBody(request, "Dữ liệu xóa đánh giá không hợp lệ.");
  if (!json.ok) {
    return json.response;
  }
  const body = json.data;
  const parsed = favoriteSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: firstIssue?.message ?? "Dữ liệu đánh giá không hợp lệ.",
      },
      { status: 400 },
    );
  }

  try {
    const deleted = await db.review.deleteMany({
      where: {
        userId: session.user.id,
        tourId: parsed.data.tourId,
      },
    });

    if (!deleted.count) {
      return NextResponse.json(
        {
          message: "Không tìm thấy đánh giá để xóa.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Đã xóa đánh giá của bạn.",
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const deleted = await demoDeletePublicReview({
        userId: session.user.id,
        tourId: parsed.data.tourId,
      });

      if (!deleted) {
        return NextResponse.json(
          {
            message: "Không tìm thấy đánh giá để xóa.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        message: "Đã xóa đánh giá của bạn.",
      });
    }

    return NextResponse.json(
      {
        message: "Không thể xóa đánh giá lúc này, vui lòng thử lại sau.",
      },
      { status: 500 },
    );
  }
}
