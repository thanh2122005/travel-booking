import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { saveNewsletterSubscriber } from "@/lib/demo/newsletter-subscriber-store";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { newsletterSchema } from "@/lib/validations/newsletter";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = consumeRateLimit(`public:newsletter:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 20,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const parsed = newsletterSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Email không hợp lệ." },
      { status: 400 },
    );
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  try {
    await db.newsletterSubscriber.create({
      data: { email: normalizedEmail },
    });

    return NextResponse.json(
      { message: "Đăng ký nhận tin thành công. Cảm ơn bạn đã theo dõi." },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({
        message: "Email này đã đăng ký nhận tin trước đó.",
      });
    }

    if (isDatabaseUnavailableError(error)) {
      const result = await saveNewsletterSubscriber(normalizedEmail);
      if (result.status === "EXISTED") {
        return NextResponse.json({
          message: "Email này đã đăng ký nhận tin trước đó.",
        });
      }

      return NextResponse.json(
        { message: "Đăng ký nhận tin thành công. Cảm ơn bạn đã theo dõi." },
        { status: 201 },
      );
    }

    console.error("Failed to save newsletter subscriber", error);
    return NextResponse.json(
      { message: "Không thể đăng ký nhận tin lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
