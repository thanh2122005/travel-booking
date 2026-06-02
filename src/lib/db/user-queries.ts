import { db } from "@/lib/db/prisma";
import { demoGetUserDashboardData } from "@/lib/demo/admin-demo-store";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { attachBookingPaymentMetadata } from "@/lib/db/booking-payment-metadata";
import { attachBookingCheckInMetadata } from "@/lib/db/booking-checkin-metadata";

type UserIdentityInput = {
  userId: string;
  userEmail?: string | null;
};

async function resolveUserId(input: UserIdentityInput) {
  const id = input.userId?.trim();
  const email = input.userEmail?.trim().toLowerCase();

  if (id && id !== "dev-admin") {
    const byId = await db.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (byId) {
      return byId.id;
    }
  }

  if (email) {
    const byEmail = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (byEmail) {
      return byEmail.id;
    }
  }

  return id || null;
}

export async function getUserDashboardData(userId: string, userEmail?: string | null) {
  try {
    const resolvedUserId = await resolveUserId({ userId, userEmail });
    if (!resolvedUserId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: resolvedUserId },
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
                id: true,
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
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      return null;
    }

    return {
      ...user,
      bookings: await attachBookingPaymentMetadata(user.bookings),
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetUserDashboardData(userId);
    }
    throw error;
  }
}

export async function getUserBookingDetail(
  userId: string,
  bookingId: string,
  userEmail?: string | null,
) {
  try {
    let booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        tour: {
          select: {
            title: true,
            slug: true,
            departureLocation: true,
          },
        },
      },
    });
    if (!booking && userEmail) {
      booking = await db.booking.findFirst({
        where: {
          id: bookingId,
          user: {
            email: userEmail.trim().toLowerCase(),
          },
        },
        include: {
          tour: {
            select: {
              title: true,
              slug: true,
              departureLocation: true,
            },
          },
        },
      });
    }
    if (!booking) {
      return null;
    }

    const [bookingWithPayment] = await attachBookingPaymentMetadata([booking]);
    const [bookingWithAllMetadata] = await attachBookingCheckInMetadata([bookingWithPayment]);
    return bookingWithAllMetadata ?? null;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const dashboard = await demoGetUserDashboardData(userId);
      return dashboard?.bookings.find((item) => item.id === bookingId) ?? null;
    }
    throw error;
  }
}
