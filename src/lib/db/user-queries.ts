import { db } from "@/lib/db/prisma";
import { demoGetUsers } from "@/lib/demo/admin-demo-store";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";

export async function getUserDashboardData(userId: string) {
  try {
    return db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            favorites: true,
            reviews: true,
          },
        },
        bookings: {
          orderBy: { createdAt: "desc" },
          include: {
            tour: {
              select: {
                title: true,
                slug: true,
                departureLocation: true,
              },
            },
          },
        },
        favorites: {
          orderBy: { createdAt: "desc" },
          include: {
            tour: {
              select: {
                title: true,
                slug: true,
                shortDescription: true,
                featuredImage: true,
                price: true,
                discountPrice: true,
                location: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        reviews: {
          orderBy: { updatedAt: "desc" },
          include: {
            tour: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const demoUsers = await demoGetUsers({ page: 1, pageSize: 50 });
      const user = demoUsers.items.find((item) => item.id === userId) ?? demoUsers.items[0];
      if (!user) return null;
      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: null,
        createdAt: user.createdAt,
        _count: user._count,
        bookings: [],
        favorites: [],
        reviews: [],
      };
    }
    throw error;
  }
}
