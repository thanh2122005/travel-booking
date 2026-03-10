import { BookingStatus, PaymentStatus, Prisma, TourStatus, UserRole, UserStatus } from "@prisma/client";
import {
  demoCreateLocation,
  demoCreateItinerary,
  demoCreateTourImage,
  demoCreateTour,
  demoGetBookings,
  demoGetDashboardData,
  demoGetLocationOptions,
  demoGetLocations,
  demoGetReviews,
  demoGetTourDetail,
  demoGetTours,
  demoGetUsers,
  demoDeleteItinerary,
  demoDeleteTourImage,
  demoUpdateItinerary,
  demoUpdateBooking,
  demoUpdateLocation,
  demoUpdateReview,
  demoUpdateTourImage,
  demoUpdateTour,
  demoUpdateUser,
} from "@/lib/demo/admin-demo-store";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";

type AdminListFilter = {
  search?: string;
  page?: number;
  pageSize?: number;
};

function getPagination(filter: AdminListFilter) {
  const page = Math.max(filter.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filter.pageSize ?? 12, 1), 50);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export async function getAdminDashboardData() {
  try {
    const [
      totalUsers,
      totalTours,
      totalLocations,
      totalBookings,
      totalReviews,
      totalFavorites,
      revenueAgg,
      bookingStatusGroups,
      paymentStatusGroups,
      recentBookings,
      recentReviews,
      recentUsers,
    ] = await Promise.all([
      db.user.count(),
      db.tour.count(),
      db.location.count(),
      db.booking.count(),
      db.review.count(),
      db.favorite.count(),
      db.booking.aggregate({
        where: {
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
      db.booking.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
      db.booking.groupBy({
        by: ["paymentStatus"],
        _count: {
          _all: true,
        },
      }),
      db.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          tour: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      db.review.findMany({
        where: {
          isVisible: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          tour: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const bookingsByStatus = bookingStatusGroups.reduce<Record<BookingStatus, number>>(
      (acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      },
      {
        PENDING: 0,
        CONFIRMED: 0,
        CANCELLED: 0,
        COMPLETED: 0,
      },
    );

    const paymentsByStatus = paymentStatusGroups.reduce<Record<PaymentStatus, number>>(
      (acc, item) => {
        acc[item.paymentStatus] = item._count._all;
        return acc;
      },
      {
        UNPAID: 0,
        PAID: 0,
      },
    );

    return {
      metrics: {
        totalUsers,
        totalTours,
        totalLocations,
        totalBookings,
        totalReviews,
        totalFavorites,
        totalRevenue: revenueAgg._sum.totalPrice ?? 0,
      },
      bookingsByStatus,
      paymentsByStatus,
      recentBookings,
      recentReviews,
      recentUsers,
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetDashboardData();
    }
    throw error;
  }
}

export async function getAdminUsers(filter: AdminListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter);

    const where: Prisma.UserWhereInput = filter.search
      ? {
          OR: [
            { fullName: { contains: filter.search, mode: "insensitive" } },
            { email: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              bookings: true,
              reviews: true,
              favorites: true,
            },
          },
        },
      }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetUsers(filter);
    }
    throw error;
  }
}

export async function getAdminTours(filter: AdminListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter);

    const where: Prisma.TourWhereInput = filter.search
      ? {
          OR: [
            { title: { contains: filter.search, mode: "insensitive" } },
            { slug: { contains: filter.search, mode: "insensitive" } },
            { location: { name: { contains: filter.search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      db.tour.count({ where }),
      db.tour.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
              favorites: true,
            },
          },
        },
      }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetTours(filter);
    }
    throw error;
  }
}

export async function getAdminTourDetail(tourId: string) {
  try {
    return db.tour.findUnique({
      where: { id: tourId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        itineraries: {
          orderBy: {
            dayNumber: "asc",
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetTourDetail(tourId);
    }
    throw error;
  }
}

export async function getAdminLocations(filter: AdminListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter);

    const where: Prisma.LocationWhereInput = filter.search
      ? {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { provinceOrCity: { contains: filter.search, mode: "insensitive" } },
            { slug: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      db.location.count({ where }),
      db.location.findMany({
        where,
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              tours: true,
            },
          },
        },
      }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetLocations(filter);
    }
    throw error;
  }
}

export async function getAdminBookings(filter: AdminListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter);

    const where: Prisma.BookingWhereInput = filter.search
      ? {
          OR: [
            { bookingCode: { contains: filter.search, mode: "insensitive" } },
            { fullName: { contains: filter.search, mode: "insensitive" } },
            { email: { contains: filter.search, mode: "insensitive" } },
            { tour: { title: { contains: filter.search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      db.booking.count({ where }),
      db.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          tour: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetBookings(filter);
    }
    throw error;
  }
}

export async function getAdminReviews(filter: AdminListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter);

    const where: Prisma.ReviewWhereInput = filter.search
      ? {
          OR: [
            { comment: { contains: filter.search, mode: "insensitive" } },
            { user: { fullName: { contains: filter.search, mode: "insensitive" } } },
            { tour: { title: { contains: filter.search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      db.review.count({ where }),
      db.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          tour: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetReviews(filter);
    }
    throw error;
  }
}

export async function getAdminLocationOptions() {
  try {
    return db.location.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetLocationOptions();
    }
    throw error;
  }
}

export async function updateAdminBooking(
  bookingId: string,
  payload: { status?: BookingStatus; paymentStatus?: PaymentStatus },
) {
  try {
    return db.booking.update({
      where: { id: bookingId },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.paymentStatus ? { paymentStatus: payload.paymentStatus } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateBooking(bookingId, payload);
    }
    throw error;
  }
}

export async function updateAdminReview(reviewId: string, payload: { isVisible?: boolean }) {
  try {
    return db.review.update({
      where: { id: reviewId },
      data: {
        ...(typeof payload.isVisible === "boolean" ? { isVisible: payload.isVisible } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateReview(reviewId, payload);
    }
    throw error;
  }
}

export async function updateAdminTour(
  tourId: string,
  payload: { status?: TourStatus; featured?: boolean },
) {
  try {
    return db.tour.update({
      where: { id: tourId },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(typeof payload.featured === "boolean" ? { featured: payload.featured } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateTour(tourId, payload);
    }
    throw error;
  }
}

export async function updateAdminLocation(locationId: string, payload: { featured?: boolean }) {
  try {
    return db.location.update({
      where: { id: locationId },
      data: {
        ...(typeof payload.featured === "boolean" ? { featured: payload.featured } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateLocation(locationId, payload);
    }
    throw error;
  }
}

export async function updateAdminUser(
  userId: string,
  payload: { role?: UserRole; status?: UserStatus },
) {
  try {
    return db.user.update({
      where: { id: userId },
      data: {
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.status ? { status: payload.status } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateUser(userId, payload);
    }
    throw error;
  }
}

export async function createAdminLocation(input: {
  name: string;
  slug: string;
  provinceOrCity: string;
  country: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  featured?: boolean;
}) {
  try {
    return db.location.create({
      data: {
        name: input.name,
        slug: input.slug,
        provinceOrCity: input.provinceOrCity,
        country: input.country,
        shortDescription: input.shortDescription,
        description: input.description,
        imageUrl: input.imageUrl,
        gallery: [input.imageUrl],
        featured: Boolean(input.featured),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoCreateLocation(input);
    }
    throw error;
  }
}

export async function createAdminTour(input: {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  durationDays: number;
  durationNights: number;
  maxGuests: number;
  transportation: string;
  departureLocation: string;
  featuredImage: string;
  status?: TourStatus;
  featured?: boolean;
  locationId: string;
}) {
  try {
    return db.tour.create({
      data: {
        title: input.title,
        slug: input.slug,
        shortDescription: input.shortDescription,
        description: input.description,
        price: input.price,
        discountPrice: input.discountPrice ?? null,
        durationDays: input.durationDays,
        durationNights: input.durationNights,
        maxGuests: input.maxGuests,
        transportation: input.transportation,
        departureLocation: input.departureLocation,
        featuredImage: input.featuredImage,
        status: input.status ?? TourStatus.ACTIVE,
        featured: Boolean(input.featured),
        locationId: input.locationId,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoCreateTour(input);
    }
    throw error;
  }
}

export async function createAdminTourImage(input: {
  tourId: string;
  imageUrl: string;
  sortOrder?: number;
}) {
  try {
    const maxSortOrder = await db.tourImage.aggregate({
      where: { tourId: input.tourId },
      _max: { sortOrder: true },
    });
    const nextSortOrder =
      typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
        ? Math.max(1, Math.trunc(input.sortOrder))
        : (maxSortOrder._max.sortOrder ?? 0) + 1;

    const created = await db.tourImage.create({
      data: {
        tourId: input.tourId,
        imageUrl: input.imageUrl,
        sortOrder: nextSortOrder,
      },
    });

    const firstImage = await db.tourImage.findFirst({
      where: { tourId: input.tourId },
      orderBy: { sortOrder: "asc" },
      select: { imageUrl: true },
    });
    if (firstImage) {
      await db.tour.update({
        where: { id: input.tourId },
        data: { featuredImage: firstImage.imageUrl },
      });
    }

    return created;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoCreateTourImage(input);
    }
    throw error;
  }
}

export async function updateAdminTourImage(
  imageId: string,
  payload: { imageUrl?: string; sortOrder?: number },
) {
  try {
    const updated = await db.tourImage.update({
      where: { id: imageId },
      data: {
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        ...(typeof payload.sortOrder === "number" && Number.isFinite(payload.sortOrder)
          ? { sortOrder: Math.max(1, Math.trunc(payload.sortOrder)) }
          : {}),
      },
      select: {
        id: true,
        tourId: true,
        imageUrl: true,
        sortOrder: true,
      },
    });

    const firstImage = await db.tourImage.findFirst({
      where: { tourId: updated.tourId },
      orderBy: { sortOrder: "asc" },
      select: { imageUrl: true },
    });
    if (firstImage) {
      await db.tour.update({
        where: { id: updated.tourId },
        data: { featuredImage: firstImage.imageUrl },
      });
    }

    return updated;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateTourImage(imageId, payload);
    }
    throw error;
  }
}

export async function deleteAdminTourImage(imageId: string) {
  try {
    const deleted = await db.tourImage.delete({
      where: { id: imageId },
      select: {
        id: true,
        tourId: true,
      },
    });

    const firstImage = await db.tourImage.findFirst({
      where: { tourId: deleted.tourId },
      orderBy: { sortOrder: "asc" },
      select: { imageUrl: true },
    });
    if (firstImage) {
      await db.tour.update({
        where: { id: deleted.tourId },
        data: { featuredImage: firstImage.imageUrl },
      });
    }

    return deleted;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoDeleteTourImage(imageId);
    }
    throw error;
  }
}

export async function createAdminItinerary(input: {
  tourId: string;
  dayNumber: number;
  title: string;
  description: string;
}) {
  try {
    return db.itinerary.create({
      data: {
        tourId: input.tourId,
        dayNumber: input.dayNumber,
        title: input.title,
        description: input.description,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoCreateItinerary(input);
    }
    throw error;
  }
}

export async function updateAdminItinerary(
  itineraryId: string,
  payload: { dayNumber?: number; title?: string; description?: string },
) {
  try {
    return db.itinerary.update({
      where: { id: itineraryId },
      data: {
        ...(typeof payload.dayNumber === "number" && Number.isFinite(payload.dayNumber)
          ? { dayNumber: Math.max(1, Math.trunc(payload.dayNumber)) }
          : {}),
        ...(payload.title ? { title: payload.title } : {}),
        ...(payload.description ? { description: payload.description } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateItinerary(itineraryId, payload);
    }
    throw error;
  }
}

export async function deleteAdminItinerary(itineraryId: string) {
  try {
    return db.itinerary.delete({
      where: { id: itineraryId },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoDeleteItinerary(itineraryId);
    }
    throw error;
  }
}

export const adminLabels = {
  tourStatus: {
    [TourStatus.ACTIVE]: "Đang hoạt động",
    [TourStatus.INACTIVE]: "Ngừng hoạt động",
  },
  bookingStatus: {
    [BookingStatus.PENDING]: "Chờ xác nhận",
    [BookingStatus.CONFIRMED]: "Đã xác nhận",
    [BookingStatus.CANCELLED]: "Đã hủy",
    [BookingStatus.COMPLETED]: "Hoàn thành",
  },
  paymentStatus: {
    [PaymentStatus.UNPAID]: "Chưa thanh toán",
    [PaymentStatus.PAID]: "Đã thanh toán",
  },
  userRole: {
    [UserRole.ADMIN]: "Quản trị viên",
    [UserRole.USER]: "Người dùng",
  },
  userStatus: {
    [UserStatus.ACTIVE]: "Hoạt động",
    [UserStatus.BLOCKED]: "Bị khóa",
  },
} as const;
