import { UserRole, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { resolveAccessState } from "@/lib/auth/access-state";
import { authOptions } from "@/lib/auth/auth-options";

export async function requireAdminApi() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const access = await resolveAccessState(session.user);
  if (access.status === UserStatus.BLOCKED) {
    return NextResponse.json({ message: "Tài khoản của bạn đã bị khóa." }, { status: 403 });
  }

  if (access.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: "Bạn không có quyền truy cập." }, { status: 403 });
  }

  return null;
}
