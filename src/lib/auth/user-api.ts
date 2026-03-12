import { UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { resolveAccessState } from "@/lib/auth/access-state";
import { authOptions } from "@/lib/auth/auth-options";

type RequireActiveUserApiOptions = {
  unauthorizedMessage?: string;
  blockedMessage?: string;
};

type ActiveUserSession = {
  user: {
    id: string;
    email?: string | null;
    status?: UserStatus;
    role?: string;
    name?: string | null;
    image?: string | null;
  };
};

type RequireActiveUserApiResult =
  | {
      session: ActiveUserSession;
      response: null;
    }
  | {
      session: null;
      response: NextResponse;
    };

export async function requireActiveUserApi(
  options: RequireActiveUserApiOptions = {},
): Promise<RequireActiveUserApiResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json(
        { message: options.unauthorizedMessage ?? "Vui lòng đăng nhập để tiếp tục." },
        { status: 401 },
      ),
    };
  }

  const access = await resolveAccessState(session.user);
  if (access.status === UserStatus.BLOCKED) {
    return {
      session: null,
      response: NextResponse.json(
        { message: options.blockedMessage ?? "Tài khoản của bạn đã bị khóa." },
        { status: 403 },
      ),
    };
  }

  return {
    session: session as ActiveUserSession,
    response: null,
  };
}
