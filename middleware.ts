import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth/auth-secret";

const authRoutes = ["/dang-nhap", "/dang-ky"];
const userRoutes = ["/tai-khoan"];
const adminRoutes = ["/admin"];
const adminApiPrefix = "/api/admin";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(token);
  const isBlocked = token?.status === "BLOCKED";
  const isAdminApiRequest = pathname.startsWith(adminApiPrefix);

  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated && !isBlocked) {
    const destination = token?.role === "ADMIN" ? "/admin" : "/tai-khoan";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isAdminApiRequest) {
    if (!isAuthenticated) {
      return NextResponse.json({ message: "Vui lòng đăng nhập." }, { status: 401 });
    }

    if (token?.role !== "ADMIN") {
      return NextResponse.json({ message: "Bạn không có quyền truy cập." }, { status: 403 });
    }

    if (isBlocked) {
      return NextResponse.json({ message: "Tài khoản của bạn đã bị khóa." }, { status: 403 });
    }
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/khong-co-quyen", request.url));
    }

    if (isBlocked) {
      return NextResponse.redirect(new URL("/khong-co-quyen", request.url));
    }
  }

  if (userRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isBlocked) {
      return NextResponse.redirect(new URL("/khong-co-quyen", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dang-nhap", "/dang-ky", "/tai-khoan/:path*", "/admin/:path*", "/api/admin/:path*"],
};

