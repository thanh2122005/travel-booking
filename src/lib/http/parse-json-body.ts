import { NextResponse } from "next/server";

type ParseJsonBodyResult =
  | {
      ok: true;
      data: unknown;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function parseJsonBody(
  request: Request,
  invalidMessage = "Dữ liệu gửi lên không hợp lệ.",
): Promise<ParseJsonBodyResult> {
  try {
    // Chuẩn hóa parse JSON để các API route không lặp try/catch.
    const data = await request.json();
    return {
      ok: true,
      data,
    };
  } catch {
    // Nếu body không phải JSON hợp lệ thì trả 400 thống nhất.
    return {
      ok: false,
      response: NextResponse.json({ message: invalidMessage }, { status: 400 }),
    };
  }
}
