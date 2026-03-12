import { UserRole, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { resolveAccessState } from "@/lib/auth/access-state";
import { authOptions } from "@/lib/auth/auth-options";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/dang-nhap");
  }

  const access = await resolveAccessState(session.user);
  if (access.status === UserStatus.BLOCKED) {
    redirect("/khong-co-quyen");
  }

  return session;
}

export async function requireAdmin() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/dang-nhap");
  }

  const access = await resolveAccessState(session.user);
  if (access.status === UserStatus.BLOCKED) {
    redirect("/khong-co-quyen");
  }

  if (access.role !== UserRole.ADMIN) {
    redirect("/khong-co-quyen");
  }

  return session;
}
