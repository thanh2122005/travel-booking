import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authRoutes = ["/dang-nhap", "/dang-ky"];
const userRoutes = ["/tai-khoan"];
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(token);

  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    const destination = token?.role === "ADMIN" ? "/admin" : "/tai-khoan";
    return NextResponse.redirect(new URL(destination, request.url));
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
  }

  if (userRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    const loginUrl = new URL("/dang-nhap", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dang-nhap", "/dang-ky", "/tai-khoan/:path*", "/admin/:path*"],
};

