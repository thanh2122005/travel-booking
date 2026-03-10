import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  BookingStatus,
  PaymentStatus,
  TourStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import {
  catalogLocations,
  catalogReviewComments,
  catalogTours,
  catalogTravelerProfiles,
  localAvatarPool,
} from "@/lib/content/vietnam-catalog";

type DemoUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

type DemoLocation = {
  id: string;
  name: string;
  slug: string;
  provinceOrCity: string;
  country: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoTour = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice: number | null;
  durationDays: number;
  durationNights: number;
  maxGuests: number;
  transportation: string;
  departureLocation: string;
  featuredImage: string;
  gallery: string[];
  status: TourStatus;
  featured: boolean;
  locationId: string;
  createdAt: string;
  updatedAt: string;
};

type DemoTourImage = {
  id: string;
  tourId: string;
  imageUrl: string;
  sortOrder: number;
};

type DemoItinerary = {
  id: string;
  tourId: string;
  dayNumber: number;
  title: string;
  description: string;
};

type DemoBooking = {
  id: string;
  bookingCode: string;
  userId: string;
  tourId: string;
  fullName: string;
  email: string;
  phone: string;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

type DemoReview = {
  id: string;
  userId: string;
  tourId: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoFavorite = {
  id: string;
  userId: string;
  tourId: string;
};

type DemoState = {
  version: number;
  users: DemoUser[];
  locations: DemoLocation[];
  tours: DemoTour[];
  tourImages: DemoTourImage[];
  itineraries: DemoItinerary[];
  bookings: DemoBooking[];
  reviews: DemoReview[];
  favorites: DemoFavorite[];
};

type ListFilter = {
  search?: string;
  page?: number;
  pageSize?: number;
};

const DEMO_DIR = path.join(process.cwd(), ".data");
const DEMO_FILE = path.join(DEMO_DIR, "admin-demo.json");
const DEMO_DATA_VERSION = 3;

const nowIso = () => new Date().toISOString();
const toDate = (value: string) => new Date(value);
const cleanId = (value: string) => value.replace(/[^a-z0-9]+/gi, "_").toLowerCase();

function buildDemoTourImages(tours: DemoTour[]) {
  return tours.flatMap((tour) =>
    tour.gallery.map((imageUrl, index) => ({
      id: `${tour.id}_img_${index + 1}`,
      tourId: tour.id,
      imageUrl,
      sortOrder: index + 1,
    })),
  );
}

function buildDemoItineraries(tours: DemoTour[]) {
  const catalogMap = new Map(catalogTours.map((tour) => [tour.slug, tour]));
  return tours.flatMap((tour) => {
    const catalogTour = catalogMap.get(tour.slug);
    return Array.from({ length: Math.max(tour.durationDays, 1) }).map((_, index) => ({
      id: `${tour.id}_it_${index + 1}`,
      tourId: tour.id,
      dayNumber: index + 1,
      title:
        catalogTour?.itineraryTitles[index] ??
        `NgÃ y ${index + 1}: Tráº£i nghiá»‡m táº¡i ${tour.departureLocation}`,
      description: "Lá»‹ch trÃ¬nh chi tiáº¿t sáº½ Ä‘Æ°á»£c cáº­p nháº­t theo thá»i tiáº¿t vÃ  nhu cáº§u Ä‘oÃ n khÃ¡ch.",
    }));
  });
}

function createInitialDemoState(): DemoState {
  const createdAt = nowIso();

  const users: DemoUser[] = [
    {
      id: "usr_admin",
      fullName: "Quáº£n trá»‹ viÃªn há»‡ thá»‘ng",
      email: "admin@example.com",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt,
      updatedAt: createdAt,
    },
    ...catalogTravelerProfiles.slice(0, 16).map((traveler, index) => ({
      id: `usr_${String(index + 1).padStart(2, "0")}`,
      fullName: traveler.fullName,
      email: traveler.email,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt,
      updatedAt: createdAt,
    })),
  ];

  const locations: DemoLocation[] = catalogLocations.map((location) => ({
    id: `loc_${cleanId(location.slug)}`,
    name: location.name,
    slug: location.slug,
    provinceOrCity: location.provinceOrCity,
    country: location.country,
    shortDescription: location.shortDescription,
    description: location.description,
    imageUrl: location.imageUrl,
    gallery: location.gallery,
    featured: Boolean(location.featured),
    createdAt,
    updatedAt: createdAt,
  }));

  const locationIdMap = new Map(locations.map((location) => [location.slug, location.id]));
  const locationGalleryMap = new Map(
    catalogLocations.map((location) => [location.slug, location.gallery]),
  );

  const tours: DemoTour[] = catalogTours.map((tour) => ({
    id: `tour_${cleanId(tour.slug)}`,
    title: tour.title,
    slug: tour.slug,
    shortDescription: tour.shortDescription,
    description: tour.description,
    price: tour.price,
    discountPrice: tour.discountPrice ?? null,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    maxGuests: tour.maxGuests,
    transportation: tour.transportation,
    departureLocation: tour.departureLocation,
    featuredImage: tour.featuredImage,
    gallery: (() => {
      const baseGallery = Array.from(new Set([tour.featuredImage, ...tour.gallery].filter(Boolean)));
      const locationGallery = (locationGalleryMap.get(tour.locationSlug) ?? []).filter(
        (image) => !baseGallery.includes(image),
      );
      return [...baseGallery, ...locationGallery].slice(0, 8);
    })(),
    status: tour.status === "INACTIVE" ? TourStatus.INACTIVE : TourStatus.ACTIVE,
    featured: Boolean(tour.featured),
    locationId: locationIdMap.get(tour.locationSlug) ?? locations[0]?.id ?? "",
    createdAt,
    updatedAt: createdAt,
  }));
  const tourImages = buildDemoTourImages(tours);
  const itineraries = buildDemoItineraries(tours);

  const regularUsers = users.filter((user) => user.role === UserRole.USER);
  const activeTours = tours.filter((tour) => tour.status === TourStatus.ACTIVE);
  const bookingStatuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ];
  const bookingCount = Math.max(72, activeTours.length * 4);

  const bookings: DemoBooking[] = Array.from({ length: bookingCount }).map((_, index) => {
    const user = regularUsers[index % regularUsers.length]!;
    const tour = activeTours[(index * 3) % activeTours.length]!;
    const guests = Math.min((index % 4) + 1, tour.maxGuests);
    const status = bookingStatuses[index % bookingStatuses.length]!;
    const paymentStatus =
      status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED
        ? PaymentStatus.PAID
        : PaymentStatus.UNPAID;

    return {
      id: `bk_${String(index + 1).padStart(2, "0")}`,
      bookingCode: `TB2026${String(index + 1).padStart(5, "0")}`,
      userId: user.id,
      tourId: tour.id,
      fullName: user.fullName,
      email: user.email,
      phone: catalogTravelerProfiles[index % catalogTravelerProfiles.length]?.phone ?? "0909009999",
      numberOfGuests: guests,
      totalPrice: (tour.discountPrice ?? tour.price) * guests,
      status,
      paymentStatus,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const reviews: DemoReview[] = [];
  const reviewPairs = new Set<string>();
  for (let userIndex = 0; userIndex < regularUsers.length; userIndex += 1) {
    for (let round = 0; round < 2; round += 1) {
      const user = regularUsers[userIndex]!;
      const tour = activeTours[(userIndex * 2 + round * 5) % activeTours.length]!;
      const pairKey = `${user.id}_${tour.id}`;
      if (reviewPairs.has(pairKey)) {
        continue;
      }
      reviewPairs.add(pairKey);
      reviews.push({
        id: `rv_${String(reviews.length + 1).padStart(2, "0")}`,
        userId: user.id,
        tourId: tour.id,
        rating: 5 - ((userIndex + round) % 3),
        comment: catalogReviewComments[(userIndex + round) % catalogReviewComments.length]!,
        isVisible: (userIndex + round) % 6 !== 0,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  const favorites: DemoFavorite[] = [];
  const favoritePairs = new Set<string>();
  regularUsers.forEach((user, userIndex) => {
    for (let offset = 0; offset < 3; offset += 1) {
      const tour = activeTours[(userIndex * 2 + offset * 7) % activeTours.length]!;
      const pairKey = `${user.id}_${tour.id}`;
      if (favoritePairs.has(pairKey)) {
        continue;
      }
      favoritePairs.add(pairKey);
      favorites.push({
        id: `fv_${String(favorites.length + 1).padStart(2, "0")}`,
        userId: user.id,
        tourId: tour.id,
      });
    }
  });

  return {
    version: DEMO_DATA_VERSION,
    users,
    locations,
    tours,
    tourImages,
    itineraries,
    bookings,
    reviews,
    favorites,
  };
}

const initialData: DemoState = createInitialDemoState();

async function ensureDemoFile() {
  try {
    await fs.access(DEMO_FILE);
  } catch {
    await writeDemo(initialData);
  }
}

function isOutdatedState(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  const state = value as Partial<DemoState>;
  if (state.version !== DEMO_DATA_VERSION) return true;
  if (!Array.isArray(state.locations) || state.locations.length < 8) return true;
  if (!Array.isArray(state.tours) || state.tours.length < 12) return true;
  if (!Array.isArray(state.users) || state.users.length < 5) return true;
  return false;
}

async function readDemo(): Promise<DemoState> {
  await ensureDemoFile();
  const content = await fs.readFile(DEMO_FILE, "utf8");
  const parsed = JSON.parse(content) as unknown;
  if (isOutdatedState(parsed)) {
    await writeDemo(initialData);
    return createInitialDemoState();
  }
  const state = parsed as DemoState;
  state.locations = state.locations.map((location) => ({
    ...location,
    gallery: Array.isArray(location.gallery) ? location.gallery : [location.imageUrl],
  }));
  state.tours = state.tours.map((tour) => ({
    ...tour,
    gallery: Array.isArray((tour as Partial<DemoTour>).gallery)
      ? (tour as Partial<DemoTour>).gallery!.filter((image): image is string => Boolean(image))
      : [tour.featuredImage],
  }));
  const fallbackTourImages = buildDemoTourImages(state.tours);
  const fallbackItineraries = buildDemoItineraries(state.tours);
  state.tourImages = Array.isArray((state as Partial<DemoState>).tourImages)
    ? (state as Partial<DemoState>).tourImages!.filter(
        (item): item is DemoTourImage =>
          Boolean(item?.id && item.tourId && item.imageUrl) && Number.isFinite(item.sortOrder),
      )
    : fallbackTourImages;
  state.itineraries = Array.isArray((state as Partial<DemoState>).itineraries)
    ? (state as Partial<DemoState>).itineraries!.filter(
        (item): item is DemoItinerary =>
          Boolean(item?.id && item.tourId && item.title && item.description) &&
          Number.isFinite(item.dayNumber),
      )
    : fallbackItineraries;
  return state;
}

async function writeDemo(state: DemoState) {
  await fs.mkdir(DEMO_DIR, { recursive: true });
  const normalized: DemoState = {
    ...state,
    version: DEMO_DATA_VERSION,
  };
  await fs.writeFile(DEMO_FILE, JSON.stringify(normalized, null, 2), "utf8");
}

function searchIncludes(source: string, keyword?: string) {
  if (!keyword) return true;
  return source.toLowerCase().includes(keyword.toLowerCase());
}

function paginate<T>(items: T[], filter: ListFilter) {
  const page = Math.max(filter.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filter.pageSize ?? 12, 1), 50);
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

function syncTourGalleryFromImages(state: DemoState, tourId: string) {
  const tour = state.tours.find((item) => item.id === tourId);
  if (!tour) return;

  const images = state.tourImages
    .filter((item) => item.tourId === tourId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!images.length) {
    const location = state.locations.find((item) => item.id === tour.locationId);
    const fallbackImage = location?.imageUrl ?? tour.featuredImage;
    const seededImage: DemoTourImage = {
      id: `${tour.id}_img_${randomUUID().slice(0, 6)}`,
      tourId: tour.id,
      imageUrl: fallbackImage,
      sortOrder: 1,
    };
    state.tourImages.push(seededImage);
    tour.gallery = [fallbackImage];
    tour.featuredImage = fallbackImage;
    return;
  }

  tour.gallery = images.map((item) => item.imageUrl);
  tour.featuredImage = images[0]!.imageUrl;
}

function getMonthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function getRecentMonthKeys(monthCount = 6) {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);

  const keys: string[] = [];
  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const current = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push(getMonthKey(current));
  }
  return keys;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${month}/${year}`;
}

function buildBookingRevenueTimeline(
  bookings: Array<{ createdAt: string; totalPrice: number; status: BookingStatus }>,
  monthCount = 6,
) {
  const keys = getRecentMonthKeys(monthCount);
  const map = new Map(
    keys.map((key) => [
      key,
      {
        monthKey: key,
        label: formatMonthLabel(key),
        bookings: 0,
        confirmedRevenue: 0,
      },
    ]),
  );

  for (const booking of bookings) {
    const key = getMonthKey(new Date(booking.createdAt));
    const row = map.get(key);
    if (!row) continue;
    row.bookings += 1;
    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED) {
      row.confirmedRevenue += booking.totalPrice;
    }
  }

  return keys.map((key) => map.get(key)!);
}

export async function demoGetLocationOptions() {
  const state = await readDemo();
  return state.locations
    .map((location) => ({ id: location.id, name: location.name, slug: location.slug }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export async function demoGetDashboardData() {
  const state = await readDemo();
  const userMap = new Map(state.users.map((user) => [user.id, user]));
  const tourMap = new Map(state.tours.map((tour) => [tour.id, tour]));

  const revenue = state.bookings
    .filter((item) => item.status === BookingStatus.CONFIRMED || item.status === BookingStatus.COMPLETED)
    .reduce((sum, item) => sum + item.totalPrice, 0);

  const bookingsByStatus: Record<BookingStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
  };
  const paymentsByStatus: Record<PaymentStatus, number> = {
    UNPAID: 0,
    PAID: 0,
  };

  for (const booking of state.bookings) {
    bookingsByStatus[booking.status] += 1;
    paymentsByStatus[booking.paymentStatus] += 1;
  }

  const bookingRevenueTimeline = buildBookingRevenueTimeline(state.bookings);

  return {
    metrics: {
      totalUsers: state.users.length,
      totalTours: state.tours.length,
      totalLocations: state.locations.length,
      totalBookings: state.bookings.length,
      totalReviews: state.reviews.length,
      totalFavorites: state.favorites.length,
      totalRevenue: revenue,
    },
    bookingsByStatus,
    paymentsByStatus,
    bookingRevenueTimeline,
    recentBookings: state.bookings.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8).map((booking) => ({
      ...booking,
      createdAt: toDate(booking.createdAt),
      user: {
        id: booking.userId,
        fullName: userMap.get(booking.userId)?.fullName ?? booking.fullName,
        email: userMap.get(booking.userId)?.email ?? booking.email,
      },
      tour: {
        id: booking.tourId,
        title: tourMap.get(booking.tourId)?.title ?? "Tour",
        slug: tourMap.get(booking.tourId)?.slug ?? "",
      },
    })),
    recentReviews: state.reviews.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8).map((review) => ({
      ...review,
      createdAt: toDate(review.createdAt),
      user: {
        id: review.userId,
        fullName: userMap.get(review.userId)?.fullName ?? "NgÆ°á»i dÃ¹ng",
      },
      tour: {
        id: review.tourId,
        title: tourMap.get(review.tourId)?.title ?? "Tour",
        slug: tourMap.get(review.tourId)?.slug ?? "",
      },
    })),
    recentUsers: state.users.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8).map((user) => ({
      ...user,
      createdAt: toDate(user.createdAt),
    })),
  };
}

export async function demoGetUsers(filter: ListFilter = {}) {
  const state = await readDemo();
  const rows = state.users
    .filter((user) => searchIncludes(user.fullName, filter.search) || searchIncludes(user.email, filter.search))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((user) => ({
      ...user,
      createdAt: toDate(user.createdAt),
      _count: {
        bookings: state.bookings.filter((booking) => booking.userId === user.id).length,
        reviews: state.reviews.filter((review) => review.userId === user.id).length,
        favorites: state.favorites.filter((favorite) => favorite.userId === user.id).length,
      },
    }));
  return paginate(rows, filter);
}

export async function demoGetTours(filter: ListFilter = {}) {
  const state = await readDemo();
  const locationMap = new Map(state.locations.map((location) => [location.id, location]));
  const rows = state.tours
    .filter((tour) => {
      const locationName = locationMap.get(tour.locationId)?.name ?? "";
      return (
        searchIncludes(tour.title, filter.search) ||
        searchIncludes(tour.slug, filter.search) ||
        searchIncludes(locationName, filter.search)
      );
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((tour) => ({
      ...tour,
      updatedAt: toDate(tour.updatedAt),
      location: {
        id: tour.locationId,
        name: locationMap.get(tour.locationId)?.name ?? "Äiá»ƒm Ä‘áº¿n",
        slug: locationMap.get(tour.locationId)?.slug ?? "",
      },
      _count: {
        bookings: state.bookings.filter((booking) => booking.tourId === tour.id).length,
        reviews: state.reviews.filter((review) => review.tourId === tour.id).length,
        favorites: state.favorites.filter((favorite) => favorite.tourId === tour.id).length,
      },
    }));
  return paginate(rows, filter);
}

export async function demoGetLocations(filter: ListFilter = {}) {
  const state = await readDemo();
  const rows = state.locations
    .filter((location) => searchIncludes(location.name, filter.search) || searchIncludes(location.slug, filter.search) || searchIncludes(location.provinceOrCity, filter.search))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .map((location) => ({
      ...location,
      updatedAt: toDate(location.updatedAt),
      _count: {
        tours: state.tours.filter((tour) => tour.locationId === location.id).length,
      },
    }));
  return paginate(rows, filter);
}

export async function demoGetLocationDetail(locationId: string) {
  const state = await readDemo();
  const location = state.locations.find((item) => item.id === locationId);
  if (!location) return null;

  const tours = state.tours
    .filter((tour) => tour.locationId === location.id)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .map((tour) => ({
      ...tour,
      updatedAt: toDate(tour.updatedAt),
      _count: {
        bookings: state.bookings.filter((item) => item.tourId === tour.id).length,
        reviews: state.reviews.filter((item) => item.tourId === tour.id).length,
        favorites: state.favorites.filter((item) => item.tourId === tour.id).length,
      },
    }));

  const stats = tours.reduce(
    (acc, tour) => ({
      totalBookings: acc.totalBookings + tour._count.bookings,
      totalReviews: acc.totalReviews + tour._count.reviews,
      totalFavorites: acc.totalFavorites + tour._count.favorites,
    }),
    {
      totalBookings: 0,
      totalReviews: 0,
      totalFavorites: 0,
    },
  );

  return {
    ...location,
    createdAt: toDate(location.createdAt),
    updatedAt: toDate(location.updatedAt),
    tours,
    _count: {
      tours: tours.length,
      bookings: stats.totalBookings,
      reviews: stats.totalReviews,
      favorites: stats.totalFavorites,
    },
  };
}

export async function demoGetBookings(filter: ListFilter = {}) {
  const state = await readDemo();
  const userMap = new Map(state.users.map((user) => [user.id, user]));
  const tourMap = new Map(state.tours.map((tour) => [tour.id, tour]));
  const rows = state.bookings
    .filter((booking) => {
      const tourTitle = tourMap.get(booking.tourId)?.title ?? "";
      return searchIncludes(booking.bookingCode, filter.search) || searchIncludes(booking.fullName, filter.search) || searchIncludes(booking.email, filter.search) || searchIncludes(tourTitle, filter.search);
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((booking) => ({
      ...booking,
      createdAt: toDate(booking.createdAt),
      user: {
        id: booking.userId,
        fullName: userMap.get(booking.userId)?.fullName ?? booking.fullName,
        email: userMap.get(booking.userId)?.email ?? booking.email,
      },
      tour: {
        id: booking.tourId,
        title: tourMap.get(booking.tourId)?.title ?? "Tour",
        slug: tourMap.get(booking.tourId)?.slug ?? "",
      },
    }));
  return paginate(rows, filter);
}

export async function demoGetReviews(filter: ListFilter = {}) {
  const state = await readDemo();
  const userMap = new Map(state.users.map((user) => [user.id, user]));
  const tourMap = new Map(state.tours.map((tour) => [tour.id, tour]));
  const rows = state.reviews
    .filter((review) => {
      const userName = userMap.get(review.userId)?.fullName ?? "";
      const tourName = tourMap.get(review.tourId)?.title ?? "";
      return searchIncludes(review.comment, filter.search) || searchIncludes(userName, filter.search) || searchIncludes(tourName, filter.search);
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((review) => ({
      ...review,
      createdAt: toDate(review.createdAt),
      user: {
        id: review.userId,
        fullName: userMap.get(review.userId)?.fullName ?? "NgÆ°á»i dÃ¹ng",
        email: userMap.get(review.userId)?.email ?? "",
      },
      tour: {
        id: review.tourId,
        title: tourMap.get(review.tourId)?.title ?? "Tour",
        slug: tourMap.get(review.tourId)?.slug ?? "",
      },
    }));
  return paginate(rows, filter);
}

export async function demoGetTourDetail(tourId: string) {
  const state = await readDemo();
  const tour = state.tours.find((item) => item.id === tourId);
  if (!tour) return null;

  const location = state.locations.find((item) => item.id === tour.locationId);
  if (!location) return null;

  const images = state.tourImages
    .filter((item) => item.tourId === tour.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const itineraries = state.itineraries
    .filter((item) => item.tourId === tour.id)
    .sort((a, b) => a.dayNumber - b.dayNumber);

  return {
    ...tour,
    location: {
      id: location.id,
      name: location.name,
      slug: location.slug,
    },
    images,
    itineraries,
    _count: {
      bookings: state.bookings.filter((item) => item.tourId === tour.id).length,
      reviews: state.reviews.filter((item) => item.tourId === tour.id).length,
      favorites: state.favorites.filter((item) => item.tourId === tour.id).length,
    },
  };
}

export async function demoCreateTourImage(input: {
  tourId: string;
  imageUrl: string;
  sortOrder?: number;
}) {
  const state = await readDemo();
  const tour = state.tours.find((item) => item.id === input.tourId);
  if (!tour) return null;

  const currentImages = state.tourImages
    .filter((item) => item.tourId === input.tourId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const targetSort =
    typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
      ? Math.min(Math.max(Math.trunc(input.sortOrder), 1), currentImages.length + 1)
      : currentImages.length + 1;

  currentImages.forEach((item) => {
    if (item.sortOrder >= targetSort) {
      item.sortOrder += 1;
    }
  });

  const image: DemoTourImage = {
    id: `img_${randomUUID().slice(0, 10)}`,
    tourId: input.tourId,
    imageUrl: input.imageUrl,
    sortOrder: targetSort,
  };
  state.tourImages.push(image);
  syncTourGalleryFromImages(state, input.tourId);
  await writeDemo(state);
  return image;
}

export async function demoUpdateTourImage(
  imageId: string,
  payload: { imageUrl?: string; sortOrder?: number },
) {
  const state = await readDemo();
  const targetImage = state.tourImages.find((item) => item.id === imageId);
  if (!targetImage) return null;

  if (payload.imageUrl) {
    targetImage.imageUrl = payload.imageUrl;
  }

  if (typeof payload.sortOrder === "number" && Number.isFinite(payload.sortOrder)) {
    const group = state.tourImages
      .filter((item) => item.tourId === targetImage.tourId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const withoutTarget = group.filter((item) => item.id !== targetImage.id);
    const nextSort = Math.min(Math.max(Math.trunc(payload.sortOrder), 1), group.length);
    withoutTarget.splice(nextSort - 1, 0, targetImage);
    withoutTarget.forEach((item, index) => {
      item.sortOrder = index + 1;
    });
  }

  syncTourGalleryFromImages(state, targetImage.tourId);
  await writeDemo(state);
  return targetImage;
}

export async function demoDeleteTourImage(imageId: string) {
  const state = await readDemo();
  const targetImage = state.tourImages.find((item) => item.id === imageId);
  if (!targetImage) return null;

  state.tourImages = state.tourImages.filter((item) => item.id !== imageId);
  const remain = state.tourImages
    .filter((item) => item.tourId === targetImage.tourId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  remain.forEach((item, index) => {
    item.sortOrder = index + 1;
  });
  syncTourGalleryFromImages(state, targetImage.tourId);
  await writeDemo(state);
  return targetImage;
}

export async function demoCreateItinerary(input: {
  tourId: string;
  dayNumber: number;
  title: string;
  description: string;
}) {
  const state = await readDemo();
  const tour = state.tours.find((item) => item.id === input.tourId);
  if (!tour) return null;
  if (
    state.itineraries.some(
      (item) => item.tourId === input.tourId && item.dayNumber === input.dayNumber,
    )
  ) {
    return null;
  }

  const itinerary: DemoItinerary = {
    id: `it_${randomUUID().slice(0, 10)}`,
    tourId: input.tourId,
    dayNumber: input.dayNumber,
    title: input.title,
    description: input.description,
  };
  state.itineraries.push(itinerary);
  await writeDemo(state);
  return itinerary;
}

export async function demoUpdateItinerary(
  itineraryId: string,
  payload: { dayNumber?: number; title?: string; description?: string },
) {
  const state = await readDemo();
  const itinerary = state.itineraries.find((item) => item.id === itineraryId);
  if (!itinerary) return null;

  if (
    typeof payload.dayNumber === "number" &&
    Number.isFinite(payload.dayNumber) &&
    payload.dayNumber !== itinerary.dayNumber
  ) {
    const hasDuplicate = state.itineraries.some(
      (item) =>
        item.id !== itinerary.id &&
        item.tourId === itinerary.tourId &&
        item.dayNumber === payload.dayNumber,
    );
    if (hasDuplicate) {
      return null;
    }
    itinerary.dayNumber = Math.max(1, Math.trunc(payload.dayNumber));
  }

  if (payload.title) {
    itinerary.title = payload.title;
  }
  if (payload.description) {
    itinerary.description = payload.description;
  }

  await writeDemo(state);
  return itinerary;
}

export async function demoDeleteItinerary(itineraryId: string) {
  const state = await readDemo();
  const itinerary = state.itineraries.find((item) => item.id === itineraryId);
  if (!itinerary) return null;
  state.itineraries = state.itineraries.filter((item) => item.id !== itineraryId);
  await writeDemo(state);
  return itinerary;
}

export async function demoUpdateBooking(id: string, payload: { status?: BookingStatus; paymentStatus?: PaymentStatus }) {
  const state = await readDemo();
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return null;
  if (payload.status) booking.status = payload.status;
  if (payload.paymentStatus) booking.paymentStatus = payload.paymentStatus;
  booking.updatedAt = nowIso();
  await writeDemo(state);
  return booking;
}

export async function demoUpdateReview(id: string, payload: { isVisible?: boolean }) {
  const state = await readDemo();
  const review = state.reviews.find((item) => item.id === id);
  if (!review) return null;
  if (typeof payload.isVisible === "boolean") review.isVisible = payload.isVisible;
  review.updatedAt = nowIso();
  await writeDemo(state);
  return review;
}

export async function demoUpdateTour(id: string, payload: { status?: TourStatus; featured?: boolean }) {
  const state = await readDemo();
  const tour = state.tours.find((item) => item.id === id);
  if (!tour) return null;
  if (payload.status) tour.status = payload.status;
  if (typeof payload.featured === "boolean") tour.featured = payload.featured;
  tour.updatedAt = nowIso();
  await writeDemo(state);
  return tour;
}

export async function demoUpdateTourContent(
  id: string,
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
  const state = await readDemo();
  const tour = state.tours.find((item) => item.id === id);
  if (!tour) return null;

  if (payload.slug && payload.slug !== tour.slug) {
    const existed = state.tours.some((item) => item.id !== id && item.slug === payload.slug);
    if (existed) {
      return null;
    }
    tour.slug = payload.slug;
  }

  if (payload.locationId && !state.locations.some((item) => item.id === payload.locationId)) {
    return null;
  }

  if (payload.title) tour.title = payload.title;
  if (payload.shortDescription) tour.shortDescription = payload.shortDescription;
  if (payload.description) tour.description = payload.description;
  if (typeof payload.price === "number" && Number.isFinite(payload.price)) tour.price = payload.price;
  if (payload.discountPrice === null || typeof payload.discountPrice === "number") {
    tour.discountPrice = payload.discountPrice;
  }
  if (typeof payload.durationDays === "number" && Number.isFinite(payload.durationDays)) {
    tour.durationDays = Math.max(1, Math.trunc(payload.durationDays));
  }
  if (typeof payload.durationNights === "number" && Number.isFinite(payload.durationNights)) {
    tour.durationNights = Math.max(0, Math.trunc(payload.durationNights));
  }
  if (typeof payload.maxGuests === "number" && Number.isFinite(payload.maxGuests)) {
    tour.maxGuests = Math.max(1, Math.trunc(payload.maxGuests));
  }
  if (payload.transportation) tour.transportation = payload.transportation;
  if (payload.departureLocation) tour.departureLocation = payload.departureLocation;
  if (payload.locationId) tour.locationId = payload.locationId;
  if (payload.status) tour.status = payload.status;
  if (typeof payload.featured === "boolean") tour.featured = payload.featured;

  if (payload.featuredImage) {
    tour.featuredImage = payload.featuredImage;
    const firstImage = state.tourImages
      .filter((item) => item.tourId === id)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (firstImage) {
      firstImage.imageUrl = payload.featuredImage;
    } else {
      state.tourImages.push({
        id: `${tour.id}_img_${randomUUID().slice(0, 6)}`,
        tourId: id,
        imageUrl: payload.featuredImage,
        sortOrder: 1,
      });
    }
    syncTourGalleryFromImages(state, id);
  }

  tour.updatedAt = nowIso();
  await writeDemo(state);
  return tour;
}

export async function demoReorderTourImages(
  tourId: string,
  items: Array<{ id: string; sortOrder: number }>,
) {
  const state = await readDemo();
  const belongs = state.tourImages.filter((image) => image.tourId === tourId);
  if (!belongs.length) return [];

  const orderMap = new Map(
    items.map((item) => [item.id, Math.max(1, Math.trunc(item.sortOrder))]),
  );

  for (const image of belongs) {
    const nextOrder = orderMap.get(image.id);
    if (typeof nextOrder === "number") {
      image.sortOrder = nextOrder;
    }
  }

  const sorted = belongs.sort((a, b) => a.sortOrder - b.sortOrder);
  sorted.forEach((item, index) => {
    item.sortOrder = index + 1;
  });

  syncTourGalleryFromImages(state, tourId);
  await writeDemo(state);
  return sorted;
}

export async function demoUpdateLocation(id: string, payload: { featured?: boolean }) {
  const state = await readDemo();
  const location = state.locations.find((item) => item.id === id);
  if (!location) return null;
  if (typeof payload.featured === "boolean") location.featured = payload.featured;
  location.updatedAt = nowIso();
  await writeDemo(state);
  return location;
}

export async function demoUpdateLocationContent(
  id: string,
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
  const state = await readDemo();
  const location = state.locations.find((item) => item.id === id);
  if (!location) return null;

  if (payload.slug && payload.slug !== location.slug) {
    const existed = state.locations.some((item) => item.id !== id && item.slug === payload.slug);
    if (existed) {
      return null;
    }
    location.slug = payload.slug;
  }

  if (payload.name) location.name = payload.name;
  if (payload.provinceOrCity) location.provinceOrCity = payload.provinceOrCity;
  if (payload.country) location.country = payload.country;
  if (payload.shortDescription) location.shortDescription = payload.shortDescription;
  if (payload.description) location.description = payload.description;
  if (typeof payload.featured === "boolean") location.featured = payload.featured;

  if (payload.imageUrl) {
    location.imageUrl = payload.imageUrl;
    const nextGallery = Array.from(
      new Set([payload.imageUrl, ...location.gallery.filter((image) => image !== payload.imageUrl)]),
    ).filter(Boolean);
    location.gallery = nextGallery.length ? nextGallery : [payload.imageUrl];
  }

  location.updatedAt = nowIso();
  await writeDemo(state);
  return location;
}

export async function demoUpdateLocationGallery(id: string, gallery: string[]) {
  const state = await readDemo();
  const location = state.locations.find((item) => item.id === id);
  if (!location) return null;

  const nextGallery = Array.from(new Set(gallery.map((image) => image.trim()).filter(Boolean)));
  if (!nextGallery.length) {
    return null;
  }

  location.gallery = nextGallery;
  location.imageUrl = nextGallery[0]!;
  location.updatedAt = nowIso();
  await writeDemo(state);
  return location;
}

export async function demoUpdateUser(id: string, payload: { role?: UserRole; status?: UserStatus }) {
  const state = await readDemo();
  const user = state.users.find((item) => item.id === id);
  if (!user) return null;
  if (payload.role) user.role = payload.role;
  if (payload.status) user.status = payload.status;
  user.updatedAt = nowIso();
  await writeDemo(state);
  return user;
}

export async function demoCreateLocation(input: {
  name: string;
  slug: string;
  provinceOrCity: string;
  country: string;
  shortDescription: string;
  description: string;
    imageUrl: string;
    featured?: boolean;
  }) {
  const state = await readDemo();
  if (state.locations.some((location) => location.slug === input.slug)) return null;
  const createdAt = nowIso();
  const location: DemoLocation = {
    id: `loc_${randomUUID().slice(0, 8)}`,
    name: input.name,
    slug: input.slug,
    provinceOrCity: input.provinceOrCity,
    country: input.country,
      shortDescription: input.shortDescription,
      description: input.description,
      imageUrl: input.imageUrl,
      gallery: [input.imageUrl],
      featured: Boolean(input.featured),
      createdAt,
      updatedAt: createdAt,
  };
  state.locations.push(location);
  await writeDemo(state);
  return location;
}

export async function demoCreateTour(input: {
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
  const state = await readDemo();
  if (state.tours.some((tour) => tour.slug === input.slug)) return null;
  if (!state.locations.some((location) => location.id === input.locationId)) return null;
  const createdAt = nowIso();
  const tour: DemoTour = {
    id: `tour_${randomUUID().slice(0, 8)}`,
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
    gallery: [input.featuredImage],
    status: input.status ?? TourStatus.ACTIVE,
    featured: Boolean(input.featured),
    locationId: input.locationId,
    createdAt,
    updatedAt: createdAt,
  };
  state.tours.push(tour);
  state.tourImages.push({
    id: `${tour.id}_img_1`,
    tourId: tour.id,
    imageUrl: input.featuredImage,
    sortOrder: 1,
  });
  state.itineraries.push(
    ...Array.from({ length: Math.max(input.durationDays, 1) }).map((_, index) => ({
      id: `${tour.id}_it_${index + 1}`,
      tourId: tour.id,
      dayNumber: index + 1,
      title: `NgÃ y ${index + 1}: Hoáº¡t Ä‘á»™ng táº¡i Ä‘iá»ƒm Ä‘áº¿n`,
      description: "Lá»‹ch trÃ¬nh cÃ³ thá»ƒ Ä‘iá»u chá»‰nh theo Ä‘iá»u kiá»‡n thá»±c táº¿ vÃ  nhu cáº§u Ä‘oÃ n.",
    })),
  );
  await writeDemo(state);
  return tour;
}

function getAverageRating(reviews: DemoReview[]) {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Number((total / reviews.length).toFixed(1));
}

function enrichToursWithRating(state: DemoState) {
  const locationMap = new Map(state.locations.map((location) => [location.id, location]));
  return state.tours.map((tour) => {
    const visibleReviews = state.reviews.filter((review) => review.tourId === tour.id && review.isVisible);
    return {
      ...tour,
      location: locationMap.get(tour.locationId)!,
      avgRating: getAverageRating(visibleReviews),
      reviewCount: visibleReviews.length,
      createdAt: toDate(tour.createdAt),
      updatedAt: toDate(tour.updatedAt),
    };
  });
}

export async function demoGetHomePublicData() {
  const state = await readDemo();
  const featuredLocations = state.locations.filter((location) => location.featured).slice(0, 6).map((location) => ({
    ...location,
    createdAt: toDate(location.createdAt),
    updatedAt: toDate(location.updatedAt),
  }));
  const allTours = enrichToursWithRating(state).filter((tour) => tour.status === TourStatus.ACTIVE);
  const featuredTours = allTours.filter((tour) => tour.featured).slice(0, 6);
  const itineraryPreview = allTours.slice(0, 4).map((tour) => ({
    ...tour,
    itineraries: Array.from({ length: Math.min(3, tour.durationDays) }).map((_, index) => ({
      id: `${tour.id}_it_${index + 1}`,
      dayNumber: index + 1,
      title: `NgÃ y ${index + 1}: Tráº£i nghiá»‡m táº¡i ${tour.location.name}`,
    })),
  }));

  const userMap = new Map(state.users.map((user) => [user.id, user]));
  const latestReviews = state.reviews
    .filter((review) => review.isVisible)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6)
    .map((review, index) => {
      const user = userMap.get(review.userId);
      const tour = allTours.find((item) => item.id === review.tourId);
      return {
        ...review,
        createdAt: toDate(review.createdAt),
        user: {
          fullName: user?.fullName ?? "NgÆ°á»i dÃ¹ng",
          avatarUrl: localAvatarPool[index % localAvatarPool.length],
        },
        tour: {
          title: tour?.title ?? "Tour",
          slug: tour?.slug ?? "",
          location: {
            name: tour?.location?.name ?? "",
          },
        },
      };
    });

  return {
    featuredLocations,
    featuredTours,
    latestReviews,
    itineraryPreview,
    stats: {
      totalTours: allTours.length,
      totalLocations: state.locations.length,
      totalBookings: state.bookings.length,
      totalReviews: state.reviews.filter((review) => review.isVisible).length,
    },
  };
}

export async function demoGetPublicTours(filters: {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: "duoi-3-ngay" | "tu-3-den-5-ngay" | "tren-5-ngay";
  featured?: boolean;
  sort?: "moi-nhat" | "gia-tang" | "gia-giam" | "danh-gia-cao";
  page?: number;
  pageSize?: number;
}) {
  const state = await readDemo();
  let tours = enrichToursWithRating(state).filter((tour) => tour.status === TourStatus.ACTIVE);

  if (filters.search) {
    tours = tours.filter((tour) => searchIncludes(tour.title, filters.search) || searchIncludes(tour.shortDescription, filters.search));
  }
  if (filters.location) {
    tours = tours.filter((tour) => tour.location.slug === filters.location);
  }
  if (typeof filters.minPrice === "number") {
    tours = tours.filter((tour) => tour.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === "number") {
    tours = tours.filter((tour) => tour.price <= filters.maxPrice!);
  }
  if (filters.featured) {
    tours = tours.filter((tour) => tour.featured);
  }

  if (filters.duration === "duoi-3-ngay") {
    tours = tours.filter((tour) => tour.durationDays < 3);
  } else if (filters.duration === "tu-3-den-5-ngay") {
    tours = tours.filter((tour) => tour.durationDays >= 3 && tour.durationDays <= 5);
  } else if (filters.duration === "tren-5-ngay") {
    tours = tours.filter((tour) => tour.durationDays > 5);
  }

  if (filters.sort === "gia-tang") {
    tours.sort((a, b) => a.price - b.price);
  } else if (filters.sort === "gia-giam") {
    tours.sort((a, b) => b.price - a.price);
  } else if (filters.sort === "danh-gia-cao") {
    tours.sort((a, b) => {
      if (b.avgRating === a.avgRating) return b.reviewCount - a.reviewCount;
      return b.avgRating - a.avgRating;
    });
  } else {
    tours.sort((a, b) => +b.createdAt - +a.createdAt);
  }

  const pagination = paginate(tours, filters);

  return {
    tours: pagination.items,
    locations: state.locations.map((location) => ({ id: location.id, name: location.name, slug: location.slug })),
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
}

export async function demoGetPublicTourBySlug(slug: string, userId?: string) {
  const state = await readDemo();
  const tours = enrichToursWithRating(state);
  const tour = tours.find((item) => item.slug === slug && item.status === TourStatus.ACTIVE);
  if (!tour) return null;

  const userMap = new Map(state.users.map((user) => [user.id, user]));
  const reviews = state.reviews
    .filter((review) => review.tourId === tour.id && review.isVisible)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((review) => ({
      ...review,
      createdAt: toDate(review.createdAt),
      user: {
        fullName: userMap.get(review.userId)?.fullName ?? "Người dùng",
      },
    }));

  const relatedTours = tours
    .filter(
      (item) =>
        item.id !== tour.id &&
        item.locationId === tour.locationId &&
        item.status === TourStatus.ACTIVE,
    )
    .slice(0, 4);
  const viewerReview = userId
    ? state.reviews.find((review) => review.userId === userId && review.tourId === tour.id)
    : null;
  const viewerFavorite = Boolean(
    userId &&
      state.favorites.some((favorite) => favorite.userId === userId && favorite.tourId === tour.id),
  );

  const savedImages = state.tourImages
    .filter((item) => item.tourId === tour.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const savedItineraries = state.itineraries
    .filter((item) => item.tourId === tour.id)
    .sort((a, b) => a.dayNumber - b.dayNumber);

  const images = savedImages.length
    ? savedImages
    : Array.from(new Set([tour.featuredImage, ...tour.gallery, ...tour.location.gallery].filter(Boolean))).map(
        (imageUrl, index) => ({
          id: `${tour.id}_img_${index + 1}`,
          tourId: tour.id,
          imageUrl,
          sortOrder: index + 1,
        }),
      );

  const itineraries = savedItineraries.length
    ? savedItineraries
    : Array.from({ length: Math.max(2, Math.min(tour.durationDays, 5)) }).map((_, index) => ({
        id: `${tour.id}_it_${index + 1}`,
        tourId: tour.id,
        dayNumber: index + 1,
        title: `Ngày ${index + 1}: Hoạt động tại ${tour.location.name}`,
        description: "Lịch trình chi tiết sẽ được điều phối theo thời tiết và nhóm khách.",
      }));

  return {
    tour: {
      ...tour,
      images,
      itineraries,
      reviews,
    },
    relatedTours,
    viewer: userId
      ? {
          isFavorite: viewerFavorite,
          review: viewerReview
            ? {
                rating: viewerReview.rating,
                comment: viewerReview.comment,
              }
            : null,
          phone: "",
        }
      : null,
  };
}

export async function demoGetPublicLocations(search?: string) {
  const state = await readDemo();
  return state.locations.filter((location) => !search || searchIncludes(location.name, search) || searchIncludes(location.provinceOrCity, search)).map((location) => ({
    ...location,
    createdAt: toDate(location.createdAt),
    updatedAt: toDate(location.updatedAt),
  }));
}

export async function demoGetPublicLocationBySlug(slug: string) {
  const state = await readDemo();
  const location = state.locations.find((item) => item.slug === slug);
  if (!location) return null;

  const tours = enrichToursWithRating(state).filter((tour) => tour.locationId === location.id && tour.status === TourStatus.ACTIVE);
  return {
    ...location,
    createdAt: toDate(location.createdAt),
    updatedAt: toDate(location.updatedAt),
    tours,
  };
}

export async function demoGetPublicReviews(limit = 24) {
  const state = await readDemo();
  const tours = enrichToursWithRating(state);
  const userMap = new Map(state.users.map((user) => [user.id, user]));
  const reviews = state.reviews
    .filter((review) => review.isVisible)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit)
    .map((review, index) => {
      const tour = tours.find((item) => item.id === review.tourId);
      return {
        ...review,
        createdAt: toDate(review.createdAt),
        user: {
          fullName: userMap.get(review.userId)?.fullName ?? "NgÆ°á»i dÃ¹ng",
          avatarUrl: localAvatarPool[index % localAvatarPool.length],
        },
        tour: {
          title: tour?.title ?? "Tour",
          slug: tour?.slug ?? "",
          location: { name: tour?.location?.name ?? "" },
        },
      };
    });

  const total = reviews.length;
  const totalScore = reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = total ? Number((totalScore / total).toFixed(1)) : 0;
  const byRating = reviews.reduce<Record<number, number>>((acc, review) => {
    acc[review.rating] = (acc[review.rating] ?? 0) + 1;
    return acc;
  }, {});

  return {
    reviews,
    summary: {
      total,
      avgRating,
      byRating,
    },
  };
}

async function ensureDemoUser(state: DemoState, userId: string, profile?: { fullName?: string; email?: string }) {
  let user = state.users.find((item) => item.id === userId);
  if (!user) {
    const createdAt = nowIso();
    user = {
      id: userId,
      fullName: profile?.fullName ?? "NgÆ°á»i dÃ¹ng",
      email: profile?.email ?? `${userId}@local.dev`,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt,
      updatedAt: createdAt,
    };
    state.users.push(user);
  }
  return user;
}

export async function demoCreatePublicBooking(input: {
  userId: string;
  tourId: string;
  fullName: string;
  email: string;
  phone: string;
  numberOfGuests: number;
  note?: string;
  departureDate?: string;
}) {
  const state = await readDemo();
  const tour = state.tours.find((item) => item.id === input.tourId && item.status === TourStatus.ACTIVE);
  if (!tour) return null;
  if (input.numberOfGuests > tour.maxGuests) return "MAX_GUEST_EXCEEDED";

  await ensureDemoUser(state, input.userId, { fullName: input.fullName, email: input.email });

  const booking: DemoBooking = {
    id: `bk_${randomUUID().slice(0, 8)}`,
    bookingCode: `TB${Date.now().toString().slice(-8)}`,
    userId: input.userId,
    tourId: tour.id,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    numberOfGuests: input.numberOfGuests,
    totalPrice: (tour.discountPrice ?? tour.price) * input.numberOfGuests,
    status: BookingStatus.PENDING,
    paymentStatus: PaymentStatus.UNPAID,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.bookings.push(booking);
  await writeDemo(state);
  return booking;
}

export async function demoTogglePublicFavorite(input: { userId: string; tourId: string; email?: string }) {
  const state = await readDemo();
  await ensureDemoUser(state, input.userId, { email: input.email });

  const existing = state.favorites.find(
    (favorite) => favorite.userId === input.userId && favorite.tourId === input.tourId,
  );
  if (existing) {
    state.favorites = state.favorites.filter((favorite) => favorite.id !== existing.id);
    await writeDemo(state);
    return { isFavorite: false };
  }

  state.favorites.push({
    id: `fv_${randomUUID().slice(0, 8)}`,
    userId: input.userId,
    tourId: input.tourId,
  });
  await writeDemo(state);
  return { isFavorite: true };
}

export async function demoUpsertPublicReview(input: {
  userId: string;
  tourId: string;
  rating: number;
  comment: string;
  email?: string;
}) {
  const state = await readDemo();
  await ensureDemoUser(state, input.userId, { email: input.email });

  const existing = state.reviews.find(
    (review) => review.userId === input.userId && review.tourId === input.tourId,
  );
  if (existing) {
    existing.rating = input.rating;
    existing.comment = input.comment;
    existing.isVisible = true;
    existing.updatedAt = nowIso();
    await writeDemo(state);
    return existing;
  }

  const review: DemoReview = {
    id: `rv_${randomUUID().slice(0, 8)}`,
    userId: input.userId,
    tourId: input.tourId,
    rating: input.rating,
    comment: input.comment,
    isVisible: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.reviews.push(review);
  await writeDemo(state);
  return review;
}

