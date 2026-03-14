import { UserRole, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { resolveAccessState } from "@/lib/auth/access-state";
import { authOptions } from "@/lib/auth/auth-options";

type AdminApiAuthResult = {
  response: NextResponse | null;
  userId: string | null;
};

export async function requireAdminApiAuth(): Promise<AdminApiAuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ message: "Vui lòng đăng nhập." }, { status: 401 }),
      userId: null,
    };
  }

  const access = await resolveAccessState(session.user);
  if (access.status === UserStatus.BLOCKED) {
    return {
      response: NextResponse.json({ message: "Tài khoản của bạn đã bị khóa." }, { status: 403 }),
      userId: session.user.id,
    };
  }

  if (access.role !== UserRole.ADMIN) {
    return {
      response: NextResponse.json({ message: "Bạn không có quyền truy cập." }, { status: 403 }),
      userId: session.user.id,
    };
  }

  return {
    response: null,
    userId: session.user.id,
  };
}

export async function requireAdminApi() {
  const auth = await requireAdminApiAuth();
  return auth.response;
}
