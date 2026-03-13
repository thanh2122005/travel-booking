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
  invalidMessage = "Du lieu gui len khong hop le.",
): Promise<ParseJsonBodyResult> {
  try {
    const data = await request.json();
    return {
      ok: true,
      data,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ message: invalidMessage }, { status: 400 }),
    };
  }
}
