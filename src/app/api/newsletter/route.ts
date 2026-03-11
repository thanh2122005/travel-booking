import { NextResponse } from "next/server";
import { saveNewsletterSubscriber } from "@/lib/demo/newsletter-subscriber-store";
import { newsletterSchema } from "@/lib/validations/newsletter";

export async function POST(request: Request) {
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

  try {
    const result = await saveNewsletterSubscriber(parsed.data.email);
    if (result.status === "EXISTED") {
      return NextResponse.json({
        message: "Email này đã đăng ký nhận tin trước đó.",
      });
    }

    return NextResponse.json(
      { message: "Đăng ký nhận tin thành công. Cảm ơn bạn đã theo dõi." },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Không thể đăng ký nhận tin lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
