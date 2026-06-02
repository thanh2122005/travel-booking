import { Prisma, TourStatus } from "@prisma/client";
import {
  demoGetPublicLocationBySlug,
  demoGetPublicLocations,
  demoGetPublicReviews,
  demoGetPublicTourBySlug,
  demoGetPublicTours,
} from "@/lib/demo/admin-demo-store";
import { isDatabaseUnavailableError, isDemoFallbackEnabled } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";
import { resolveSingleRoomSurchargePerAdult } from "@/lib/pricing/single-room-surcharge";

/**
 * Ý đồ file này:
 * - Chứa toàn bộ query cho khu public (home, list, detail, review...).
 * - Tách riêng khỏi admin để tránh lẫn quyền và giảm độ phức tạp từng route.
 * - Một số hàm trả thêm dữ liệu "viewer" khi có userId (favorite/review của chính user).
 */

export type TourFilterInput = {
  search?: string;
  location?: string;
  departureLocation?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: "duoi-3-ngay" | "tu-3-den-5-ngay" | "tren-5-ngay";
  featured?: boolean;
  sort?: "moi-nhat" | "gia-tang" | "gia-giam" | "danh-gia-cao";
  page?: number;
  pageSize?: number;
};

// Map rating đã tính sẵn theo tourId để tránh query lặp mỗi card.
type RatingMap = Record<string, { avgRating: number; reviewCount: number }>;
type TourViewerData = {
  isFavorite: boolean;
  review: {
    rating: number;
    comment: string;
  } | null;
  phone: string;
};

async function getTourRatings(tourIds: string[]): Promise<RatingMap> {
  if (!tourIds.length) {
    return {};
  }

  // Group theo tourId để lấy avg rating + tổng review trong 1 query.
  const grouped = await db.review.groupBy({
    by: ["tourId"],
    where: {
      tourId: {
        in: tourIds,
      },
      isVisible: true,
    },
    _avg: {
      rating: true,
    },
    _count: {
      _all: true,
    },
  });

  return grouped.reduce<RatingMap>((acc, item) => {
    acc[item.tourId] = {
      avgRating: Number(item._avg.rating ?? 0),
      reviewCount: item._count._all,
    };
    return acc;
  }, {});
}

function buildDurationWhere(duration?: TourFilterInput["duration"]): Prisma.TourWhereInput {
  // Convert filter thời lượng từ UI sang Prisma where.
  if (!duration) {
    return {};
  }

  if (duration === "duoi-3-ngay") {
    return { durationDays: { lt: 3 } };
  }

  if (duration === "tu-3-den-5-ngay") {
    return { durationDays: { gte: 3, lte: 5 } };
  }

  return { durationDays: { gt: 5 } };
}

export async function getHomePublicData() {
  try {
    // Trang chủ lấy dữ liệu song song để giảm tổng thời gian chờ.
    const [
      featuredLocations,
      featuredTours,
      latestReviews,
      itineraryPreviewRaw,
      totalTours,
      totalLocations,
      totalBookings,
      totalReviews,
    ] = await Promise.all([
      db.location.findMany({
        where: { featured: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      db.tour.findMany({
        where: {
          status: TourStatus.ACTIVE,
          featured: true,
        },
        include: {
          location: true,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.review.findMany({
        where: {
          isVisible: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        include: {
          user: {
            select: {
              fullName: true,
              avatarUrl: true,
            },
          },
          tour: {
            select: {
              title: true,
              slug: true,
              location: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      db.tour.findMany({
        where: {
          status: TourStatus.ACTIVE,
        },
        include: {
          location: true,
          itineraries: {
            orderBy: {
              dayNumber: "asc",
            },
            take: 3,
          },
          _count: {
            select: {
              itineraries: true,
            },
          },
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
      db.tour.count({
        where: {
          status: TourStatus.ACTIVE,
        },
      }),
      db.location.count(),
      db.booking.count(),
      db.review.count({
        where: {
          isVisible: true,
        },
      }),
    ]);

    const ratings = await getTourRatings(featuredTours.map((item) => item.id));
    const itineraryPreview = itineraryPreviewRaw
      .filter((item) => item._count.itineraries > 0)
      .map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        location: item.location,
        itineraries: item.itineraries,
        itineraryCount: item._count.itineraries,
      }));

    return {
      featuredLocations,
      featuredTours: featuredTours.map((item) => ({
        ...item,
        avgRating: ratings[item.id]?.avgRating ?? 0,
        reviewCount: ratings[item.id]?.reviewCount ?? 0,
      })),
      latestReviews,
      itineraryPreview,
      stats: {
        totalTours,
        totalLocations,
        totalBookings,
        totalReviews,
      },
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        featuredLocations: [],
        featuredTours: [],
        latestReviews: [],
        itineraryPreview: [],
        stats: {
          totalTours: 0,
          totalLocations: 0,
          totalBookings: 0,
          totalReviews: 0,
        },
      };
    }
    throw error;
  }
}

export async function getTours(filters: TourFilterInput) {
  try {
    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = filters.pageSize ?? 9;

    // Thuật toán Phân trang (Offset-based Pagination):
    // Dùng công thức: skip = (page - 1) * pageSize để bỏ qua các bản ghi trang trước đó.
    // Lấy số lượng bản ghi bằng đúng `pageSize` (mặc định 9 tour/trang).

    // Xây dựng bộ lọc tìm kiếm (Dynamic Where Clause):
    // Gom tất cả các điều kiện lọc (tên, giá, điểm đến) vào 1 object `where` để Prisma truy vấn.
    const where: Prisma.TourWhereInput = {
      status: TourStatus.ACTIVE,
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search } },
              { shortDescription: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.location ? { location: { slug: filters.location } } : {}),
      ...(typeof filters.minPrice === "number" ? { price: { gte: filters.minPrice } } : {}),
      ...(typeof filters.maxPrice === "number" ? { price: { lte: filters.maxPrice } } : {}),
      ...(filters.featured ? { featured: true } : {}),
      ...(filters.departureLocation ? { departureLocation: filters.departureLocation } : {}),
      ...buildDurationWhere(filters.duration),
    };

    // Truy vấn song song (Parallel Queries):
    // Sử dụng `Promise.all` để chạy đồng thời 3 câu lệnh (tổng số tour, danh sách điểm đến, điểm khởi hành).
    // Kỹ thuật này giúp giảm 1/3 thời gian load so với chạy tuần tự từng câu lệnh `await`.
    const [total, allLocations, departurePlaces] = await Promise.all([
      db.tour.count({ where }),
      db.location.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      db.tour.findMany({
        where: { status: TourStatus.ACTIVE },
        select: { departureLocation: true },
        distinct: ["departureLocation"],
        orderBy: { departureLocation: "asc" },
      }),
    ]);

    if (filters.sort === "danh-gia-cao") {
      // Sort theo rating phải làm trước pagination để không sai thứ hạng.
      // Trade-off: cần query tập dữ liệu lớn hơn. Hiện tại ưu tiên dùng ranking.
      const allTours = await db.tour.findMany({
        where,
        include: {
          location: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const ratings = await getTourRatings(allTours.map((item) => item.id));
      const sorted = allTours
        .map((item) => ({
          ...item,
          avgRating: ratings[item.id]?.avgRating ?? 0,
          reviewCount: ratings[item.id]?.reviewCount ?? 0,
        }))
        .sort((a, b) => {
          if (b.avgRating === a.avgRating) {
            if (b.reviewCount === a.reviewCount) {
              return +new Date(b.createdAt) - +new Date(a.createdAt);
            }
            return b.reviewCount - a.reviewCount;
          }
          return b.avgRating - a.avgRating;
        });

      return {
        tours: sorted.slice((page - 1) * pageSize, page * pageSize),
        locations: allLocations,
        departurePlaces: departurePlaces.map((item) => item.departureLocation),
        total,
        page,
        pageSize,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      };
    }

    const tours = await db.tour.findMany({
      where,
      include: {
        location: true,
      },
      orderBy:
        filters.sort === "gia-tang"
          ? { price: "asc" }
          : filters.sort === "gia-giam"
            ? { price: "desc" }
            : { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const ratings = await getTourRatings(tours.map((item) => item.id));

    return {
      tours: tours.map((item) => ({
        ...item,
        avgRating: ratings[item.id]?.avgRating ?? 0,
        reviewCount: ratings[item.id]?.reviewCount ?? 0,
      })),
      locations: allLocations,
      departurePlaces: departurePlaces.map((item) => item.departureLocation),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error) && isDemoFallbackEnabled()) {
      return demoGetPublicTours(filters);
    }
    throw error;
  }
}

export async function getTourBySlug(slug: string, userId?: string) {
  try {
    // Tìm chi tiết tour theo Slug (URL):
    // Lấy thông tin tour kèm theo hình ảnh, lịch trình và nhận xét thông qua JOIN bảng.
    const tour = await db.tour.findUnique({
    where: { slug },
    include: {
      location: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      itineraries: {
        orderBy: { dayNumber: "asc" },
      },
      reviews: {
        where: { isVisible: true },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

    if (!tour || tour.status === TourStatus.INACTIVE) {
      return null;
    }

    const relatedTours = await db.tour.findMany({
    where: {
      status: TourStatus.ACTIVE,
      locationId: tour.locationId,
      id: { not: tour.id },
    },
    include: {
      location: true,
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

    const ratings = await getTourRatings([tour.id, ...relatedTours.map((item) => item.id)]);

    let viewer: TourViewerData | null = null;
    if (userId) {
      // Tùy biến trải nghiệm người dùng (Personalization):
      // Nếu user đã đăng nhập, chạy thêm query lấy dữ liệu "Đã yêu thích", "Đã đánh giá", "Số điện thoại" để hiển thị sẵn lên form đặt tour.
      const [favorite, ownReview, ownProfile] = await Promise.all([
        db.favorite.findUnique({
          where: {
            userId_tourId: {
              userId,
              tourId: tour.id,
            },
          },
          select: { id: true },
        }),
        db.review.findUnique({
          where: {
            userId_tourId: {
              userId,
              tourId: tour.id,
            },
          },
          select: {
            rating: true,
            comment: true,
          },
        }),
        db.user.findUnique({
          where: { id: userId },
          select: { phone: true },
        }),
      ]);

      viewer = {
        isFavorite: Boolean(favorite),
        review: ownReview
          ? {
              rating: ownReview.rating,
              comment: ownReview.comment,
            }
          : null,
        phone: ownProfile?.phone ?? "",
      };
    }

    const surchargeRows = (await db.$queryRawUnsafe(
      "SELECT `id`, `singleRoomSurchargePerAdult` FROM `Tour` WHERE `id` = ? LIMIT 1",
      tour.id,
    )) as Array<{ id: string; singleRoomSurchargePerAdult?: number | bigint | null }>;
    const singleRoomSurchargePerAdult = resolveSingleRoomSurchargePerAdult({
      durationNights: tour.durationNights,
      unitPrice: tour.discountPrice ?? tour.price,
      configuredSurcharge: surchargeRows[0]?.singleRoomSurchargePerAdult ?? 0,
    });

    return {
      tour: {
        ...tour,
        singleRoomSurchargePerAdult,
        avgRating: ratings[tour.id]?.avgRating ?? 0,
        reviewCount: ratings[tour.id]?.reviewCount ?? 0,
      },
      relatedTours: relatedTours.map((item) => ({
        ...item,
        avgRating: ratings[item.id]?.avgRating ?? 0,
        reviewCount: ratings[item.id]?.reviewCount ?? 0,
      })),
      viewer,
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetPublicTourBySlug(slug, userId);
    }
    throw error;
  }
}

export async function getLocations(search?: string) {
  try {
    const locations = await db.location.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { provinceOrCity: { contains: search } },
            ],
          }
        : undefined,
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    });
    return locations;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetPublicLocations(search);
    }
    throw error;
  }
}

export async function getContactTourOptions(initialTourId?: string) {
  try {
    const tours = await db.tour.findMany({
      where: {
        status: TourStatus.ACTIVE,
      },
      select: {
        id: true,
        title: true,
        location: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 120,
    });

    const options = tours.map((tour) => ({
      id: tour.id,
      title: tour.title,
      locationName: tour.location.name,
    }));

    if (initialTourId && !options.some((tour) => tour.id === initialTourId)) {
      const selectedTour = await db.tour.findUnique({
        where: {
          id: initialTourId,
        },
        select: {
          id: true,
          title: true,
          status: true,
          location: {
            select: {
              name: true,
            },
          },
        },
      });

      if (selectedTour && selectedTour.status === TourStatus.ACTIVE) {
        options.unshift({
          id: selectedTour.id,
          title: selectedTour.title,
          locationName: selectedTour.location.name,
        });
      }
    }

    return options;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const fallback = await demoGetPublicTours({
        page: 1,
        pageSize: 500,
        sort: "moi-nhat",
      });

      return fallback.tours.map((tour) => ({
        id: tour.id,
        title: tour.title,
        locationName: tour.location.name,
      }));
    }
    throw error;
  }
}

export async function getLocationBySlug(slug: string) {
  try {
    const location = await db.location.findUnique({
      where: { slug },
      include: {
        tours: {
          where: { status: TourStatus.ACTIVE },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!location) {
      return null;
    }

    const ratings = await getTourRatings(location.tours.map((item) => item.id));

    return {
      ...location,
      tours: location.tours.map((item) => ({
        ...item,
        avgRating: ratings[item.id]?.avgRating ?? 0,
        reviewCount: ratings[item.id]?.reviewCount ?? 0,
      })),
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetPublicLocationBySlug(slug);
    }
    throw error;
  }
}

export async function getPublicReviews(limit = 24) {
  try {
    const [reviews, grouped] = await Promise.all([
      db.review.findMany({
        where: {
          isVisible: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        include: {
          user: {
            select: {
              fullName: true,
              avatarUrl: true,
            },
          },
          tour: {
            select: {
              title: true,
              slug: true,
              location: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      db.review.groupBy({
        by: ["rating"],
        where: {
          isVisible: true,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const total = grouped.reduce((acc, item) => acc + item._count._all, 0);
    const totalScore = grouped.reduce((acc, item) => acc + item.rating * item._count._all, 0);
    const avgRating = total ? Number((totalScore / total).toFixed(1)) : 0;

    return {
      reviews,
      summary: {
        total,
        avgRating,
        byRating: grouped.reduce<Record<number, number>>((acc, item) => {
          acc[item.rating] = item._count._all;
          return acc;
        }, {}),
      },
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return demoGetPublicReviews(limit);
    }
    throw error;
  }
}


