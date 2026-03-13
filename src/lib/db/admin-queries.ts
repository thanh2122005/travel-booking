import { BookingStatus, PaymentStatus, Prisma, TourStatus, UserRole, UserStatus } from "@prisma/client";
import {
  demoCreateLocation,
  demoCreateItinerary,
  demoCreateTourImage,
  demoCreateTour,
  demoGetBookings,
  demoGetDashboardData,
  demoGetLocationDetail,
  demoGetLocationOptions,
  demoGetLocations,
  demoGetReviews,
  demoGetTourDetail,
  demoGetTours,
  demoGetUsers,
  demoExportBookings,
  demoExportUsers,
  demoExportReviews,
  demoDeleteItinerary,
  demoDeleteTourImage,
  demoReorderTourImages,
  demoUpdateLocationContent,
  demoUpdateLocationGallery,
  demoUpdateReviewContent,
  demoUpdateTourContent,
  demoUpdateItinerary,
  demoUpdateBooking,
  demoUpdateBookingDetail,
  demoUpdateBookingsBulk,
  demoUpdateLocation,
  demoDeleteLocation,
  demoUpdateReview,
  demoUpdateReviewsBulk,
  demoUpdateTourImage,
  demoUpdateTour,
  demoDeleteTour,
  demoUpdateUserContent,
  demoUpdateUser,
  demoDeleteUser,
} from "@/lib/demo/admin-demo-store";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";

type AdminListFilter = {
  search?: string;
  page?: number;
  pageSize?: number;
};

type AdminTourListFilter = AdminListFilter & {
  status?: TourStatus;
  featured?: boolean;
  locationId?: string;
};

type AdminUserListFilter = AdminListFilter & {
  role?: UserRole;
  status?: UserStatus;
  createdFrom?: Date;
  createdTo?: Date;
};

type AdminBookingListFilter = AdminListFilter & {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  createdFrom?: Date;
  createdTo?: Date;
};

type AdminReviewListFilter = AdminListFilter & {
  isVisible?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
};

type TimelineGranularity = "day" | "week" | "month";

type DashboardTimelineOptions = {
  monthCount?: number;
  rangeDays?: number;
  granularity?: TimelineGranularity;
  startDate?: Date | string;
  endDate?: Date | string;
};

const MAX_ADMIN_DATE_RANGE_DAYS = 366;

function getPagination(filter: AdminListFilter) {
  const page = Math.max(filter.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filter.pageSize ?? 12, 1), 50);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function normalizeDateRange(
  from?: Date,
  to?: Date,
  maxDays = MAX_ADMIN_DATE_RANGE_DAYS,
) {
  let start = from ? startOfDay(from) : undefined;
  let end = to ? endOfDay(to) : undefined;

  if (!start && !end) {
    return { start, end };
  }

  if (!start && end) {
    start = startOfDay(end);
    start.setDate(start.getDate() - (maxDays - 1));
  }

  if (start && !end) {
    end = endOfDay(start);
    end.setDate(end.getDate() + (maxDays - 1));
  }

  if (start && end && start > end) {
    const swappedStart = startOfDay(end);
    const swappedEnd = endOfDay(start);
    start = swappedStart;
    end = swappedEnd;
  }

  if (start && end) {
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1,
    );
    if (days > maxDays) {
      start = startOfDay(end);
      start.setDate(start.getDate() - (maxDays - 1));
    }
  }

  return { start, end };
}

function buildAdminBookingWhere(filter: AdminBookingListFilter) {
  const { start: createdFrom, end: createdTo } = normalizeDateRange(filter.createdFrom, filter.createdTo);

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

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.paymentStatus) {
    where.paymentStatus = filter.paymentStatus;
  }
  if (createdFrom || createdTo) {
    where.createdAt = {
      ...(createdFrom ? { gte: createdFrom } : {}),
      ...(createdTo ? { lte: createdTo } : {}),
    };
  }

  return where;
}

function buildAdminReviewWhere(filter: AdminReviewListFilter) {
  const { start: createdFrom, end: createdTo } = normalizeDateRange(filter.createdFrom, filter.createdTo);

  const where: Prisma.ReviewWhereInput = filter.search
    ? {
        OR: [
          { comment: { contains: filter.search, mode: "insensitive" } },
          { user: { fullName: { contains: filter.search, mode: "insensitive" } } },
          { tour: { title: { contains: filter.search, mode: "insensitive" } } },
        ],
      }
    : {};

  if (typeof filter.isVisible === "boolean") {
    where.isVisible = filter.isVisible;
  }
  if (createdFrom || createdTo) {
    where.createdAt = {
      ...(createdFrom ? { gte: createdFrom } : {}),
      ...(createdTo ? { lte: createdTo } : {}),
    };
  }

  return where;
}

function getMonthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function getDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate(),
  ).padStart(2, "0")}`;
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfWeek(value: Date) {
  const next = startOfDay(value);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function normalizeDate(value?: Date | string) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTimelineLabel(date: Date, granularity: TimelineGranularity) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  if (granularity === "day") return `${day}/${month}`;
  if (granularity === "week") return `Tuần ${day}/${month}`;
  return `${month}/${year}`;
}

function getTimelineKey(date: Date, granularity: TimelineGranularity) {
  if (granularity === "day") return getDateKey(startOfDay(date));
  if (granularity === "week") return getDateKey(startOfWeek(date));
  return getMonthKey(date);
}

function buildTimelineRows(
  startDate: Date,
  endDate: Date,
  granularity: TimelineGranularity,
) {
  const rows: Array<{
    monthKey: string;
    label: string;
    bookings: number;
    confirmedRevenue: number;
  }> = [];

  if (granularity === "day") {
    let cursor = startOfDay(startDate);
    const end = endOfDay(endDate);
    while (cursor <= end) {
      rows.push({
        monthKey: getDateKey(cursor),
        label: formatTimelineLabel(cursor, granularity),
        bookings: 0,
        confirmedRevenue: 0,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
    return rows;
  }

  if (granularity === "week") {
    let cursor = startOfWeek(startDate);
    const end = endOfDay(endDate);
    while (cursor <= end) {
      rows.push({
        monthKey: getDateKey(cursor),
        label: formatTimelineLabel(cursor, granularity),
        bookings: 0,
        confirmedRevenue: 0,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
    }
    return rows;
  }

  let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    rows.push({
      monthKey: getMonthKey(cursor),
      label: formatTimelineLabel(cursor, granularity),
      bookings: 0,
      confirmedRevenue: 0,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return rows;
}

function resolveDashboardOptions(options?: DashboardTimelineOptions) {
  const now = new Date();
  const requestedRangeDays = options?.rangeDays;
  const rangeDays =
    typeof requestedRangeDays === "number" && [30, 90, 180, 365].includes(requestedRangeDays)
      ? requestedRangeDays
      : 180;

  const endDate = normalizeDate(options?.endDate) ?? now;
  const monthCount = [3, 6, 12].includes(options?.monthCount ?? 6) ? options?.monthCount ?? 6 : 6;

  const defaultStartDate = (() => {
    const base = new Date(endDate);
    base.setDate(1);
    base.setHours(0, 0, 0, 0);
    base.setMonth(base.getMonth() - (monthCount - 1));
    return base;
  })();

  const rawStartDate = startOfDay(
    normalizeDate(options?.startDate) ??
      (options?.rangeDays
        ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - (rangeDays - 1))
        : defaultStartDate),
  );
  const normalizedEndDate = endOfDay(endDate);
  const { start: normalizedStartDate, end: boundedEndDate } = normalizeDateRange(
    rawStartDate,
    normalizedEndDate,
    MAX_ADMIN_DATE_RANGE_DAYS,
  );
  const startDate = normalizedStartDate ?? startOfDay(normalizedEndDate);
  const safeEndDate = boundedEndDate ?? normalizedEndDate;

  const dayDiff = Math.max(
    1,
    Math.ceil((safeEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const granularity: TimelineGranularity =
    options?.granularity ??
    (dayDiff <= 45 ? "day" : dayDiff <= 210 ? "week" : "month");

  return {
    startDate,
    endDate: safeEndDate,
    rangeDays,
    monthCount,
    granularity,
  };
}

function buildBookingRevenueTimeline(
  bookings: Array<{ createdAt: Date; totalPrice: number; status: BookingStatus }>,
  options: { startDate: Date; endDate: Date; granularity: TimelineGranularity },
) {
  const rows = buildTimelineRows(options.startDate, options.endDate, options.granularity);
  const map = new Map(rows.map((row) => [row.monthKey, row]));

  for (const booking of bookings) {
    if (booking.createdAt < options.startDate || booking.createdAt > options.endDate) continue;
    const key = getTimelineKey(booking.createdAt, options.granularity);
    const row = map.get(key);
    if (!row) continue;
    row.bookings += 1;
    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) {
      row.confirmedRevenue += booking.totalPrice;
    }
  }

  return rows;
}

export async function getAdminDashboardData(options?: DashboardTimelineOptions) {
  try {
    const timelineOptions = resolveDashboardOptions(options);

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
      bookingTimelineRows,
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
        where: {
          createdAt: {
            gte: timelineOptions.startDate,
            lte: timelineOptions.endDate,
          },
        },
        select: {
          createdAt: true,
          totalPrice: true,
          status: true,
          paymentStatus: true,
          tourId: true,
          tour: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
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
              price: true,
              discountPrice: true,
              maxGuests: true,
              departureLocation: true,
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
              price: true,
              discountPrice: true,
              maxGuests: true,
              departureLocation: true,
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
    const bookingRevenueTimeline = buildBookingRevenueTimeline(bookingTimelineRows, timelineOptions);
    const timeRangeStats = bookingTimelineRows.reduce(
      (acc, booking) => {
        const isConfirmed =
          booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED;
        const isPaid = booking.paymentStatus === PaymentStatus.PAID;

        return {
          bookings: acc.bookings + 1,
          confirmedBookings: acc.confirmedBookings + (isConfirmed ? 1 : 0),
          paidBookings: acc.paidBookings + (isPaid ? 1 : 0),
          pendingBookings: acc.pendingBookings + (booking.status === BookingStatus.PENDING ? 1 : 0),
          cancelledBookings:
            acc.cancelledBookings + (booking.status === BookingStatus.CANCELLED ? 1 : 0),
          completedBookings:
            acc.completedBookings + (booking.status === BookingStatus.COMPLETED ? 1 : 0),
          confirmedRevenue: acc.confirmedRevenue + (isConfirmed ? booking.totalPrice : 0),
        };
      },
      {
        bookings: 0,
        confirmedBookings: 0,
        paidBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        confirmedRevenue: 0,
      },
    );
    const topRevenueToursMap = bookingTimelineRows.reduce<
      Map<
        string,
        {
          tourId: string;
          title: string;
          slug: string;
          bookings: number;
          confirmedBookings: number;
          paidBookings: number;
          confirmedRevenue: number;
        }
      >
    >((acc, booking) => {
      const current = acc.get(booking.tourId) ?? {
        tourId: booking.tourId,
        title: booking.tour.title,
        slug: booking.tour.slug,
        bookings: 0,
        confirmedBookings: 0,
        paidBookings: 0,
        confirmedRevenue: 0,
      };
      current.bookings += 1;
      if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) {
        current.confirmedBookings += 1;
        current.confirmedRevenue += booking.totalPrice;
      }
      if (booking.paymentStatus === PaymentStatus.PAID) {
        current.paidBookings += 1;
      }
      acc.set(booking.tourId, current);
      return acc;
    }, new Map());
    const topRevenueTours = Array.from(topRevenueToursMap.values())
      .sort((a, b) => {
        if (b.confirmedRevenue !== a.confirmedRevenue) {
          return b.confirmedRevenue - a.confirmedRevenue;
        }
        if (b.confirmedBookings !== a.confirmedBookings) {
          return b.confirmedBookings - a.confirmedBookings;
        }
        return b.bookings - a.bookings;
      })
      .slice(0, 6);
    const bookingCount = timeRangeStats.bookings;
    const confirmedCount = timeRangeStats.confirmedBookings;

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
      bookingRevenueTimeline,
      timeRangeStats: {
        ...timeRangeStats,
        confirmationRate: bookingCount ? confirmedCount / bookingCount : 0,
        paymentRate: bookingCount ? timeRangeStats.paidBookings / bookingCount : 0,
        averageConfirmedOrderValue: confirmedCount
          ? Math.round(timeRangeStats.confirmedRevenue / confirmedCount)
          : 0,
      },
      topRevenueTours,
      monthCount: timelineOptions.monthCount,
      rangeDays: timelineOptions.rangeDays,
      timelineGranularity: timelineOptions.granularity,
      timelineStartDate: timelineOptions.startDate,
      timelineEndDate: timelineOptions.endDate,
      recentBookings,
      recentReviews,
      recentUsers,
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetDashboardData(options);
    }
    throw error;
  }
}

export async function getAdminUsers(
  filter: AdminUserListFilter = {},
) {
  try {
    const { page, pageSize, skip } = getPagination(filter);
    const { start: createdFrom, end: createdTo } = normalizeDateRange(filter.createdFrom, filter.createdTo);

    const where: Prisma.UserWhereInput = filter.search
      ? {
          OR: [
            { fullName: { contains: filter.search, mode: "insensitive" } },
            { email: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {};
    if (filter.role) {
      where.role = filter.role;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      };
    }

    const [total, items] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
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

export async function exportAdminUsers(filter: AdminUserListFilter = {}) {
  try {
    const { start: createdFrom, end: createdTo } = normalizeDateRange(filter.createdFrom, filter.createdTo);

    const where: Prisma.UserWhereInput = filter.search
      ? {
          OR: [
            { fullName: { contains: filter.search, mode: "insensitive" } },
            { email: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {};
    if (filter.role) {
      where.role = filter.role;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: createdTo } : {}),
      };
    }

    return db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
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
      return demoExportUsers(filter);
    }
    throw error;
  }
}

export async function getAdminTours(filter: AdminTourListFilter = {}) {
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
    if (filter.status) {
      where.status = filter.status;
    }
    if (typeof filter.featured === "boolean") {
      where.featured = filter.featured;
    }
    if (filter.locationId) {
      where.locationId = filter.locationId;
    }

    const [total, items] = await Promise.all([
      db.tour.count({ where }),
      db.tour.findMany({
        where,
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
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

export async function getAdminLocationDetail(locationId: string) {
  try {
    const location = await db.location.findUnique({
      where: { id: locationId },
      include: {
        tours: {
          orderBy: { updatedAt: "desc" },
          include: {
            _count: {
              select: {
                bookings: true,
                reviews: true,
                favorites: true,
              },
            },
          },
        },
        _count: {
          select: {
            tours: true,
          },
        },
      },
    });

    if (!location) return null;

    const stats = location.tours.reduce(
      (acc, tour) => ({
        bookings: acc.bookings + tour._count.bookings,
        reviews: acc.reviews + tour._count.reviews,
        favorites: acc.favorites + tour._count.favorites,
      }),
      {
        bookings: 0,
        reviews: 0,
        favorites: 0,
      },
    );

    return {
      ...location,
      _count: {
        ...location._count,
        bookings: stats.bookings,
        reviews: stats.reviews,
        favorites: stats.favorites,
      },
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetLocationDetail(locationId);
    }
    throw error;
  }
}

export async function getAdminBookings(filter: AdminBookingListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter);
    const where = buildAdminBookingWhere(filter);

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
              price: true,
              discountPrice: true,
              maxGuests: true,
              departureLocation: true,
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

export async function exportAdminBookings(filter: AdminBookingListFilter = {}) {
  try {
    const where = buildAdminBookingWhere(filter);

    return db.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
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
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoExportBookings(filter);
    }
    throw error;
  }
}

export async function getAdminReviews(filter: AdminReviewListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter);
    const where = buildAdminReviewWhere(filter);

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

export async function exportAdminReviews(filter: AdminReviewListFilter = {}) {
  try {
    const where = buildAdminReviewWhere(filter);

    return db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
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
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoExportReviews(filter);
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

export async function updateAdminBookingsBulk(input: {
  ids: string[];
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}) {
  try {
    const ids = Array.from(new Set(input.ids.filter(Boolean)));
    if (!ids.length) {
      return { count: 0 };
    }

    return db.booking.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateBookingsBulk(input);
    }
    throw error;
  }
}

export async function updateAdminBookingDetail(
  bookingId: string,
  payload: {
    fullName?: string;
    email?: string;
    phone?: string;
    numberOfGuests?: number;
    note?: string | null;
    departureDate?: string | null;
    paymentMethod?: string;
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
  },
) {
  try {
    const current = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        numberOfGuests: true,
        tour: {
          select: {
            price: true,
            discountPrice: true,
            maxGuests: true,
          },
        },
      },
    });
    if (!current) return null;

    const nextGuests =
      typeof payload.numberOfGuests === "number" && Number.isFinite(payload.numberOfGuests)
        ? Math.max(1, Math.trunc(payload.numberOfGuests))
        : current.numberOfGuests;

    if (nextGuests > current.tour.maxGuests) {
      return null;
    }

    const unitPrice = current.tour.discountPrice ?? current.tour.price;
    const nextDepartureDate =
      payload.departureDate === null
        ? null
        : payload.departureDate
          ? new Date(payload.departureDate)
          : undefined;

    return db.booking.update({
      where: { id: bookingId },
      data: {
        ...(payload.fullName ? { fullName: payload.fullName } : {}),
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.phone ? { phone: payload.phone } : {}),
        ...(typeof payload.numberOfGuests === "number" ? { numberOfGuests: nextGuests } : {}),
        ...(payload.note === null || typeof payload.note === "string" ? { note: payload.note } : {}),
        ...(payload.paymentMethod ? { paymentMethod: payload.paymentMethod } : {}),
        ...(nextDepartureDate !== undefined ? { departureDate: nextDepartureDate } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.paymentStatus ? { paymentStatus: payload.paymentStatus } : {}),
        totalPrice: unitPrice * nextGuests,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateBookingDetail(bookingId, payload);
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

export async function updateAdminReviewsBulk(input: { ids: string[]; isVisible: boolean }) {
  try {
    const ids = Array.from(new Set(input.ids.filter(Boolean)));
    if (!ids.length) {
      return { count: 0 };
    }

    return db.review.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        isVisible: input.isVisible,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateReviewsBulk(input);
    }
    throw error;
  }
}

export async function updateAdminReviewContent(
  reviewId: string,
  payload: { rating?: number; comment?: string; isVisible?: boolean },
) {
  try {
    return db.review.update({
      where: { id: reviewId },
      data: {
        ...(typeof payload.rating === "number" && Number.isFinite(payload.rating)
          ? { rating: Math.min(5, Math.max(1, Math.trunc(payload.rating))) }
          : {}),
        ...(payload.comment ? { comment: payload.comment } : {}),
        ...(typeof payload.isVisible === "boolean" ? { isVisible: payload.isVisible } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateReviewContent(reviewId, payload);
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

export async function deleteAdminTour(tourId: string) {
  try {
    return db.$transaction(async (tx) => {
      await tx.favorite.deleteMany({ where: { tourId } });
      await tx.review.deleteMany({ where: { tourId } });
      await tx.booking.deleteMany({ where: { tourId } });
      await tx.itinerary.deleteMany({ where: { tourId } });
      await tx.tourImage.deleteMany({ where: { tourId } });
      return tx.tour.delete({
        where: { id: tourId },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoDeleteTour(tourId);
    }
    throw error;
  }
}

export async function updateAdminTourContent(
  tourId: string,
  payload: {
    title?: string;
    slug?: string;
    shortDescription?: string;
    description?: string;
    price?: number;
    discountPrice?: number | null;
    durationDays?: number;
    durationNights?: number;
    maxGuests?: number;
    transportation?: string;
    departureLocation?: string;
    featuredImage?: string;
    locationId?: string;
    status?: TourStatus;
    featured?: boolean;
  },
) {
  try {
    const updated = await db.tour.update({
      where: { id: tourId },
      data: {
        ...(payload.title ? { title: payload.title } : {}),
        ...(payload.slug ? { slug: payload.slug } : {}),
        ...(payload.shortDescription ? { shortDescription: payload.shortDescription } : {}),
        ...(payload.description ? { description: payload.description } : {}),
        ...(typeof payload.price === "number" ? { price: payload.price } : {}),
        ...(payload.discountPrice === null || typeof payload.discountPrice === "number"
          ? { discountPrice: payload.discountPrice }
          : {}),
        ...(typeof payload.durationDays === "number" ? { durationDays: payload.durationDays } : {}),
        ...(typeof payload.durationNights === "number" ? { durationNights: payload.durationNights } : {}),
        ...(typeof payload.maxGuests === "number" ? { maxGuests: payload.maxGuests } : {}),
        ...(payload.transportation ? { transportation: payload.transportation } : {}),
        ...(payload.departureLocation ? { departureLocation: payload.departureLocation } : {}),
        ...(payload.featuredImage ? { featuredImage: payload.featuredImage } : {}),
        ...(payload.locationId ? { locationId: payload.locationId } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(typeof payload.featured === "boolean" ? { featured: payload.featured } : {}),
      },
    });

    if (payload.featuredImage) {
      const firstImage = await db.tourImage.findFirst({
        where: { tourId },
        orderBy: { sortOrder: "asc" },
      });
      if (firstImage) {
        await db.tourImage.update({
          where: { id: firstImage.id },
          data: { imageUrl: payload.featuredImage },
        });
      } else {
        await db.tourImage.create({
          data: {
            tourId,
            imageUrl: payload.featuredImage,
            sortOrder: 1,
          },
        });
      }
    }

    return updated;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateTourContent(tourId, payload);
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

export async function deleteAdminLocation(locationId: string) {
  try {
    const totalTours = await db.tour.count({
      where: { locationId },
    });
    if (totalTours > 0) {
      return "HAS_TOURS";
    }

    return db.location.delete({
      where: { id: locationId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoDeleteLocation(locationId);
    }
    throw error;
  }
}

export async function updateAdminLocationContent(
  locationId: string,
  payload: {
    name?: string;
    slug?: string;
    provinceOrCity?: string;
    country?: string;
    shortDescription?: string;
    description?: string;
    imageUrl?: string;
    featured?: boolean;
  },
) {
  try {
    const updated = await db.location.update({
      where: { id: locationId },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.slug ? { slug: payload.slug } : {}),
        ...(payload.provinceOrCity ? { provinceOrCity: payload.provinceOrCity } : {}),
        ...(payload.country ? { country: payload.country } : {}),
        ...(payload.shortDescription ? { shortDescription: payload.shortDescription } : {}),
        ...(payload.description ? { description: payload.description } : {}),
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        ...(typeof payload.featured === "boolean" ? { featured: payload.featured } : {}),
      },
    });

    if (payload.imageUrl) {
      const nextGallery = Array.from(
        new Set([payload.imageUrl, ...updated.gallery.filter((image) => image !== payload.imageUrl)]),
      ).filter(Boolean);
      return db.location.update({
        where: { id: locationId },
        data: {
          gallery: nextGallery.length ? nextGallery : [payload.imageUrl],
          imageUrl: payload.imageUrl,
        },
      });
    }

    return updated;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateLocationContent(locationId, payload);
    }
    throw error;
  }
}

export async function updateAdminLocationGallery(locationId: string, gallery: string[]) {
  try {
    const nextGallery = Array.from(new Set(gallery.map((image) => image.trim()).filter(Boolean)));
    if (!nextGallery.length) {
      return null;
    }

    return db.location.update({
      where: { id: locationId },
      data: {
        gallery: nextGallery,
        imageUrl: nextGallery[0]!,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateLocationGallery(locationId, gallery);
    }
    throw error;
  }
}

export async function updateAdminUser(
  userId: string,
  payload: { role?: UserRole; status?: UserStatus },
) {
  try {
    const current = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });
    if (!current) return null;

    const nextRole = payload.role ?? current.role;
    const nextStatus = payload.status ?? current.status;
    if (
      current.role === UserRole.ADMIN &&
      (nextRole !== UserRole.ADMIN || nextStatus === UserStatus.BLOCKED)
    ) {
      const totalAdmins = await db.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (totalAdmins <= 1) {
        return "LAST_ADMIN";
      }
    }

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

export async function deleteAdminUser(userId: string) {
  try {
    const current = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!current) return null;

    if (current.role === UserRole.ADMIN) {
      const totalAdmins = await db.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (totalAdmins <= 1) {
        return "LAST_ADMIN";
      }
    }

    return db.$transaction(async (tx) => {
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.booking.deleteMany({ where: { userId } });
      return tx.user.delete({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      });
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoDeleteUser(userId);
    }
    throw error;
  }
}

export async function updateAdminUserContent(
  userId: string,
  payload: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    role?: UserRole;
    status?: UserStatus;
  },
) {
  try {
    const current = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });
    if (!current) return null;

    const nextRole = payload.role ?? current.role;
    const nextStatus = payload.status ?? current.status;
    if (
      current.role === UserRole.ADMIN &&
      (nextRole !== UserRole.ADMIN || nextStatus === UserStatus.BLOCKED)
    ) {
      const totalAdmins = await db.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (totalAdmins <= 1) {
        return "LAST_ADMIN";
      }
    }

    return db.user.update({
      where: { id: userId },
      data: {
        ...(payload.fullName ? { fullName: payload.fullName } : {}),
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.phone === null || typeof payload.phone === "string"
          ? { phone: payload.phone }
          : {}),
        ...(payload.avatarUrl === null || typeof payload.avatarUrl === "string"
          ? { avatarUrl: payload.avatarUrl }
          : {}),
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.status ? { status: payload.status } : {}),
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoUpdateUserContent(userId, payload);
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

    const orderedImages = await db.tourImage.findMany({
      where: { tourId: deleted.tourId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, imageUrl: true },
    });
    if (orderedImages.length) {
      await db.$transaction(
        orderedImages.map((image, index) =>
          db.tourImage.update({
            where: { id: image.id },
            data: { sortOrder: index + 1 },
          }),
        ),
      );
      await db.tour.update({
        where: { id: deleted.tourId },
        data: { featuredImage: orderedImages[0]!.imageUrl },
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

export async function reorderAdminTourImages(
  tourId: string,
  items: Array<{ id: string; sortOrder: number }>,
) {
  try {
    const currentImages = await db.tourImage.findMany({
      where: { tourId },
      select: { id: true, imageUrl: true },
    });
    if (!currentImages.length) {
      return [];
    }

    const currentIds = new Set(currentImages.map((image) => image.id));
    const uniqueItems = Array.from(
      new Map(
        items
          .filter((item) => currentIds.has(item.id))
          .map((item) => [
            item.id,
            {
              id: item.id,
              sortOrder: Math.max(1, Math.trunc(item.sortOrder)),
            },
          ]),
      ).values(),
    ).sort((a, b) => a.sortOrder - b.sortOrder);

    const missingIds = currentImages
      .map((image) => image.id)
      .filter((id) => !uniqueItems.some((item) => item.id === id));
    const normalizedOrder = [
      ...uniqueItems.map((item) => item.id),
      ...missingIds,
    ];

    await db.$transaction(
      normalizedOrder.map((imageId, index) =>
        db.tourImage.update({
          where: { id: imageId },
          data: { sortOrder: index + 1 },
        }),
      ),
    );

    const orderedImages = await db.tourImage.findMany({
      where: { tourId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, tourId: true, imageUrl: true, sortOrder: true },
    });

    if (orderedImages.length) {
      await db.tour.update({
        where: { id: tourId },
        data: { featuredImage: orderedImages[0]!.imageUrl },
      });
    }

    return orderedImages;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoReorderTourImages(tourId, items);
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
