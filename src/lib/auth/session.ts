import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth-options";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/dang-nhap");
  }

  return session;
}

export async function requireAdmin() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/dang-nhap");
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect("/khong-co-quyen");
  }

  return session;
}

