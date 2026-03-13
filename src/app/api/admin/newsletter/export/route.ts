import { UserRole, UserStatus } from "@prisma/client";
import { getAuthSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { format } from "date-fns";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (
      !session?.user ||
      session.user.role !== UserRole.ADMIN ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const subscribers = await db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    const headers = ["Email", "Ngay Dang Ky"];
    const rows = subscribers.map((sub) => [
      sub.email,
      format(new Date(sub.createdAt), "dd/MM/yyyy HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="newsletter.csv"',
      },
    });
  } catch (error) {
    console.error("Export Newsletter Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
