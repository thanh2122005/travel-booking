import { NextResponse } from "next/server";
import { saveContactInquiry } from "@/lib/demo/contact-inquiry-store";
import { contactInquirySchema } from "@/lib/validations/contact";

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

  const parsed = contactInquirySchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Thông tin tư vấn không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const inquiry = await saveContactInquiry(parsed.data);
    return NextResponse.json(
      {
        message:
          "Đã nhận yêu cầu tư vấn. Đội ngũ sẽ liên hệ với bạn sớm nhất có thể.",
        referenceCode: inquiry.referenceCode,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Không thể gửi yêu cầu lúc này, vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
