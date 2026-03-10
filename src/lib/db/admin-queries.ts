import { BookingStatus, PaymentStatus, Prisma, TourStatus, UserRole, UserStatus } from "@prisma/client";
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
}

export async function getAdminUsers(filter: AdminListFilter = {}) {
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
}

export async function getAdminTours(filter: AdminListFilter = {}) {
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
}

export async function getAdminLocations(filter: AdminListFilter = {}) {
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
}

export async function getAdminBookings(filter: AdminListFilter = {}) {
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
}

export async function getAdminReviews(filter: AdminListFilter = {}) {
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
