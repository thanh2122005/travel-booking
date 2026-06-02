import { UserRole, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { resolveAccessState } from "@/lib/auth/access-state";
import { authOptions } from "@/lib/auth/auth-options";

type AdminApiAuthResult = {
  response: NextResponse | null;
  userId: string | null;
  userName: string | null;
};

export async function requireAdminApiAuth(): Promise<AdminApiAuthResult> {
  // Lấy session: Giải mã JWT token từ cookie để xác định người dùng đang request.
  const session = await getServerSession(authOptions);

  // Kiểm tra đăng nhập: Chặn các request không hợp lệ (nặc danh, token hết hạn).
  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ message: "Vui lòng đăng nhập." }, { status: 401 }),
      userId: null,
      userName: null,
    };
  }

  const access = await resolveAccessState(session.user);
  // Chặn tài khoản bị khóa: Không cho tài khoản bị ban (Blocked) thực hiện thao tác quản trị.
  if (access.status === UserStatus.BLOCKED) {
    return {
      response: NextResponse.json({ message: "Tài khoản của bạn đã bị khóa." }, { status: 403 }),
      userId: session.user.id,
      userName: session.user.name ?? null,
    };
  }

  // Phân quyền (Role-based Access Control): Chặn user thường (ROLE = USER) truy cập API admin để bảo mật dữ liệu.
  if (access.role !== UserRole.ADMIN) {
    return {
      response: NextResponse.json({ message: "Bạn không có quyền truy cập." }, { status: 403 }),
      userId: session.user.id,
      userName: session.user.name ?? null,
    };
  }

  // Hợp lệ: Trả về thông tin session để route xử lý logic lưu trữ dữ liệu.
  return {
    response: null,
    userId: session.user.id,
    userName: session.user.name ?? null,
  };
}

export async function requireAdminApi() {
  try {
    // Wrapper trả response lỗi sẵn để route dùng nhanh.
    const auth = await requireAdminApiAuth();
    return auth.response;
  } catch {
    return NextResponse.json(
      { message: "Hệ thống tạm thời gián đoạn, vui lòng thử lại." },
      { status: 503 },
    );
  }
}
