import { Prisma, TourStatus } from "@prisma/client";
import { db } from "@/lib/db/prisma";

export type TourFilterInput = {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: "duoi-3-ngay" | "tu-3-den-5-ngay" | "tren-5-ngay";
  featured?: boolean;
  sort?: "moi-nhat" | "gia-tang" | "gia-giam" | "danh-gia-cao";
  page?: number;
  pageSize?: number;
};

type RatingMap = Record<string, { avgRating: number; reviewCount: number }>;

async function getTourRatings(tourIds: string[]): Promise<RatingMap> {
  if (!tourIds.length) {
    return {};
  }

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
  const [featuredLocations, featuredTours] = await Promise.all([
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
  ]);

  const ratings = await getTourRatings(featuredTours.map((item) => item.id));

  return {
    featuredLocations,
    featuredTours: featuredTours.map((item) => ({
      ...item,
      avgRating: ratings[item.id]?.avgRating ?? 0,
      reviewCount: ratings[item.id]?.reviewCount ?? 0,
    })),
  };
}

export async function getTours(filters: TourFilterInput) {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? 9;

  const where: Prisma.TourWhereInput = {
    status: TourStatus.ACTIVE,
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { shortDescription: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.location ? { location: { slug: filters.location } } : {}),
    ...(typeof filters.minPrice === "number" ? { price: { gte: filters.minPrice } } : {}),
    ...(typeof filters.maxPrice === "number" ? { price: { lte: filters.maxPrice } } : {}),
    ...(filters.featured ? { featured: true } : {}),
    ...buildDurationWhere(filters.duration),
  };

  const [total, tours, allLocations] = await Promise.all([
    db.tour.count({ where }),
    db.tour.findMany({
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
    }),
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
  ]);

  const ratings = await getTourRatings(tours.map((item) => item.id));

  const enrichedTours = tours.map((item) => ({
    ...item,
    avgRating: ratings[item.id]?.avgRating ?? 0,
    reviewCount: ratings[item.id]?.reviewCount ?? 0,
  }));

  const sortedTours =
    filters.sort === "danh-gia-cao"
      ? enrichedTours.sort((a, b) => {
          if (b.avgRating === a.avgRating) {
            return b.reviewCount - a.reviewCount;
          }
          return b.avgRating - a.avgRating;
        })
      : enrichedTours;

  return {
    tours: sortedTours,
    locations: allLocations,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getTourBySlug(slug: string) {
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

  return {
    tour: {
      ...tour,
      avgRating: ratings[tour.id]?.avgRating ?? 0,
      reviewCount: ratings[tour.id]?.reviewCount ?? 0,
    },
    relatedTours: relatedTours.map((item) => ({
      ...item,
      avgRating: ratings[item.id]?.avgRating ?? 0,
      reviewCount: ratings[item.id]?.reviewCount ?? 0,
    })),
  };
}

export async function getLocations(search?: string) {
  return db.location.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { provinceOrCity: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getLocationBySlug(slug: string) {
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
}
