import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth/auth-secret";

const ADMIN_ROLE = "ADMIN";
const BLOCKED_STATUS = "BLOCKED";

function buildCallbackUrl(request: NextRequest) {
  const callbackPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return callbackPath || "/admin";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminApiPath = pathname.startsWith("/api/admin");
  const isAdminPagePath = pathname.startsWith("/admin");

  if (!isAdminApiPath && !isAdminPagePath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  if (!token?.sub) {
    if (isAdminApiPath) {
      return NextResponse.json({ message: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const loginUrl = new URL("/dang-nhap", request.url);
    loginUrl.searchParams.set("callbackUrl", buildCallbackUrl(request));
    return NextResponse.redirect(loginUrl);
  }

  const tokenRole = typeof token.role === "string" ? token.role : "";
  const tokenStatus = typeof token.status === "string" ? token.status : "";
  const isBlocked = tokenStatus === BLOCKED_STATUS;
  const isAdmin = tokenRole === ADMIN_ROLE;

  if (isBlocked || !isAdmin) {
    if (isAdminApiPath) {
      return NextResponse.json(
        {
          message: isBlocked ? "Tài khoản của bạn đã bị khóa." : "Bạn không có quyền truy cập.",
        },
        { status: 403 },
      );
    }

    const deniedUrl = new URL("/khong-co-quyen", request.url);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
