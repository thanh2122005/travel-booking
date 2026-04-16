import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "@/lib/auth/auth-secret";
import { buildCallbackUrl } from "@/lib/auth/callback-url";

const authRoutes = ["/dang-nhap", "/dang-ky"];
const userRoutes = ["/tai-khoan"];
const adminRoutes = ["/admin"];
const adminApiPrefix = "/api/admin";

export async function proxy(request: NextRequest) {
  // L?y JWT token hi?n t?i d? xác d?nh tr?ng thái dang nh?p và quy?n.
  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  const { pathname } = request.nextUrl;
  const callbackUrl = buildCallbackUrl(pathname, request.nextUrl.search);
  const isAuthenticated = Boolean(token);
  const isBlocked = token?.status === "BLOCKED";
  const isAdminApiRequest = pathname.startsWith(adminApiPrefix);

  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated && !isBlocked) {
    // Ngu?i dã dang nh?p không nên quay l?i trang login/register.
    const destination = token?.role === "ADMIN" ? "/admin" : "/tai-khoan";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isAdminApiRequest) {
    // API admin tr? JSON l?i thay vì redirect d? client x? lý dúng chu?n API.
    if (!isAuthenticated) {
      return NextResponse.json({ message: "Vui lòng dang nh?p." }, { status: 401 });
    }

    if (token?.role !== "ADMIN") {
      return NextResponse.json({ message: "B?n không có quy?n truy c?p." }, { status: 403 });
    }

    if (isBlocked) {
      return NextResponse.json({ message: "Tài kho?n c?a b?n dã b? khóa." }, { status: 403 });
    }
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Gi? callbackUrl d? login xong quay l?i dúng trang ngu?i dùng mu?n vào.
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
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
      // Các route user profile cung yêu c?u dang nh?p tru?c.
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
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


