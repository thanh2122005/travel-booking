import { UserRole, UserStatus } from "@prisma/client";
import { db } from "@/lib/db/prisma";

type SessionUserLike = {
  id?: string | null;
  role?: UserRole | string | null;
  status?: UserStatus | string | null;
};

type AccessState = {
  authenticated: boolean;
  role: UserRole;
  status: UserStatus;
};

function normalizeRole(value: SessionUserLike["role"]) {
  return value === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER;
}

function normalizeStatus(value: SessionUserLike["status"]) {
  return value === UserStatus.BLOCKED ? UserStatus.BLOCKED : UserStatus.ACTIVE;
}

function getSessionFallbackState(user: SessionUserLike): AccessState {
  return {
    authenticated: Boolean(user.id),
    role: normalizeRole(user.role),
    status: normalizeStatus(user.status),
  };
}

export async function resolveAccessState(user: SessionUserLike | undefined | null): Promise<AccessState> {
  if (!user?.id) {
    return {
      authenticated: false,
      role: UserRole.USER,
      status: UserStatus.BLOCKED,
    };
  }

  if (user.id === "dev-admin") {
    if (process.env.NODE_ENV !== "production") {
      return {
        authenticated: true,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      };
    }

    return {
      authenticated: true,
      role: UserRole.USER,
      status: UserStatus.BLOCKED,
    };
  }

  try {
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        status: true,
      },
    });

    if (!currentUser) {
      return {
        authenticated: true,
        role: UserRole.USER,
        status: UserStatus.BLOCKED,
      };
    }

    return {
      authenticated: true,
      role: currentUser.role,
      status: currentUser.status,
    };
  } catch {
    // DB có thể tạm lỗi trong môi trường dev/demo, fallback về session hiện có.
    return getSessionFallbackState(user);
  }
}

