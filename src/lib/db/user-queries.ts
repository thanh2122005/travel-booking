import { db } from "@/lib/db/prisma";

export async function getUserDashboardData(userId: string) {
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
}
