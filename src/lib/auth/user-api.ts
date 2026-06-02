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
  // Lấy session hiện tại: Giải mã JWT token từ request để biết người dùng là ai.
  const session = await getServerSession(authOptions);

  // Kiểm tra đăng nhập: Chặn đứng các request nặc danh (chưa đăng nhập hoặc token hết hạn).
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
  // Kiểm tra tài khoản bị khóa: Chặn user thực hiện các thao tác khi bị admin cấm (VD: bom hàng, spam).
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
    // Vượt qua tất cả bảo mật: Trả về thông tin session để route xử lý nghiệp vụ tiếp theo.
    session: session as ActiveUserSession,
    response: null,
  };
}
