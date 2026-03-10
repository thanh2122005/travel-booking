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
  status: TourStatus;
  featured: boolean;
  locationId: string;
  createdAt: string;
  updatedAt: string;
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
  users: DemoUser[];
  locations: DemoLocation[];
  tours: DemoTour[];
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

const nowIso = () => new Date().toISOString();
const toDate = (value: string) => new Date(value);

const initialData: DemoState = (() => {
  const createdAt = nowIso();
  return {
    users: [
      {
        id: "usr_admin",
        fullName: "Quản trị viên hệ thống",
        email: "admin@example.com",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "usr_01",
        fullName: "Nguyễn Minh Anh",
        email: "minhanh@example.com",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "usr_02",
        fullName: "Trần Bảo Long",
        email: "baolong@example.com",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    locations: [
      {
        id: "loc_hanoi",
        name: "Hà Nội",
        slug: "ha-noi",
        provinceOrCity: "Hà Nội",
        country: "Việt Nam",
        shortDescription: "Thủ đô nghìn năm văn hiến.",
        description: "Hà Nội nổi bật với phố cổ và ẩm thực đường phố.",
        imageUrl: "/immerse-vietnam/images/HaNoi/hanoicover.jpg",
        gallery: [
          "/immerse-vietnam/images/HaNoi/hanoi1.webp",
          "/immerse-vietnam/images/HaNoi/hanoi2.jpg",
          "/immerse-vietnam/images/HaNoi/hanoi3.jpg",
        ],
        featured: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "loc_danang",
        name: "Đà Nẵng",
        slug: "da-nang",
        provinceOrCity: "Đà Nẵng",
        country: "Việt Nam",
        shortDescription: "Thành phố biển năng động.",
        description: "Đà Nẵng là điểm đến hấp dẫn với biển đẹp và dịch vụ tốt.",
        imageUrl: "/immerse-vietnam/images/DaNang/danangcover.jpg",
        gallery: [
          "/immerse-vietnam/images/DaNang/danang1.jpg",
          "/immerse-vietnam/images/DaNang/danang2.jpg",
          "/immerse-vietnam/images/DaNang/danang3.jpg",
        ],
        featured: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "loc_halong",
        name: "Hạ Long",
        slug: "ha-long",
        provinceOrCity: "Quảng Ninh",
        country: "Việt Nam",
        shortDescription: "Di sản thiên nhiên thế giới.",
        description: "Vịnh Hạ Long lý tưởng cho hành trình du thuyền nghỉ dưỡng.",
        imageUrl: "/immerse-vietnam/images/HaLong/halongcover.jpg",
        gallery: [
          "/immerse-vietnam/images/HaLong/halong1.jpg",
          "/immerse-vietnam/images/HaLong/halong2.jpg",
          "/immerse-vietnam/images/HaLong/halong3.jpg",
        ],
        featured: false,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    tours: [
      {
        id: "tour_dn_01",
        title: "Đà Nẵng - Hội An 4N3Đ",
        slug: "da-nang-hoi-an-4n3d",
        shortDescription: "Kết hợp biển và phố cổ.",
        description: "Lịch trình linh hoạt cho gia đình và nhóm bạn.",
        price: 5290000,
        discountPrice: 4890000,
        durationDays: 4,
        durationNights: 3,
        maxGuests: 24,
        transportation: "Máy bay + xe du lịch",
        departureLocation: "TP.HCM",
        featuredImage: "/immerse-vietnam/images/DaNang/danang1.jpg",
        status: TourStatus.ACTIVE,
        featured: true,
        locationId: "loc_danang",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "tour_hn_01",
        title: "Hà Nội - Ninh Bình 3N2Đ",
        slug: "ha-noi-ninh-binh-3n2d",
        shortDescription: "Hành trình văn hóa và thiên nhiên miền Bắc.",
        description: "Khám phá di sản và trải nghiệm văn hóa bản địa.",
        price: 3890000,
        discountPrice: 3490000,
        durationDays: 3,
        durationNights: 2,
        maxGuests: 20,
        transportation: "Xe du lịch",
        departureLocation: "Hà Nội",
        featuredImage: "/immerse-vietnam/images/HaNoi/hanoi1.webp",
        status: TourStatus.ACTIVE,
        featured: false,
        locationId: "loc_hanoi",
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "tour_hl_01",
        title: "Du thuyền Hạ Long 2N1Đ",
        slug: "du-thuyen-ha-long-2n1d",
        shortDescription: "Nghỉ đêm trên vịnh.",
        description: "Hành trình cao cấp với trải nghiệm khác biệt.",
        price: 4590000,
        discountPrice: null,
        durationDays: 2,
        durationNights: 1,
        maxGuests: 30,
        transportation: "Limousine",
        departureLocation: "Hà Nội",
        featuredImage: "/immerse-vietnam/images/HaLong/halong1.jpg",
        status: TourStatus.ACTIVE,
        featured: true,
        locationId: "loc_halong",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    bookings: [
      {
        id: "bk_01",
        bookingCode: "TB2026031001",
        userId: "usr_01",
        tourId: "tour_dn_01",
        fullName: "Nguyễn Minh Anh",
        email: "minhanh@example.com",
        phone: "0909111111",
        numberOfGuests: 2,
        totalPrice: 9780000,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "bk_02",
        bookingCode: "TB2026031002",
        userId: "usr_02",
        tourId: "tour_hl_01",
        fullName: "Trần Bảo Long",
        email: "baolong@example.com",
        phone: "0909222222",
        numberOfGuests: 3,
        totalPrice: 13770000,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    reviews: [
      {
        id: "rv_01",
        userId: "usr_01",
        tourId: "tour_dn_01",
        rating: 5,
        comment: "Dịch vụ tốt, lịch trình hợp lý.",
        isVisible: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "rv_02",
        userId: "usr_02",
        tourId: "tour_hl_01",
        rating: 4,
        comment: "Trải nghiệm đẹp nhưng cần thêm thời gian tự do.",
        isVisible: true,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    favorites: [
      { id: "fv_01", userId: "usr_01", tourId: "tour_hl_01" },
      { id: "fv_02", userId: "usr_02", tourId: "tour_dn_01" },
    ],
  };
})();

async function ensureDemoFile() {
  try {
    await fs.access(DEMO_FILE);
  } catch {
    await fs.mkdir(DEMO_DIR, { recursive: true });
    await fs.writeFile(DEMO_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

async function readDemo(): Promise<DemoState> {
  await ensureDemoFile();
  const content = await fs.readFile(DEMO_FILE, "utf8");
  const parsed = JSON.parse(content) as DemoState;
  parsed.locations = parsed.locations.map((location) => ({
    ...location,
    gallery: Array.isArray(location.gallery) ? location.gallery : [location.imageUrl],
  }));
  return parsed;
}

async function writeDemo(state: DemoState) {
  await fs.mkdir(DEMO_DIR, { recursive: true });
  await fs.writeFile(DEMO_FILE, JSON.stringify(state, null, 2), "utf8");
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
        fullName: userMap.get(review.userId)?.fullName ?? "Người dùng",
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
        name: locationMap.get(tour.locationId)?.name ?? "Điểm đến",
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
        fullName: userMap.get(review.userId)?.fullName ?? "Người dùng",
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

export async function demoUpdateLocation(id: string, payload: { featured?: boolean }) {
  const state = await readDemo();
  const location = state.locations.find((item) => item.id === id);
  if (!location) return null;
  if (typeof payload.featured === "boolean") location.featured = payload.featured;
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
    status: input.status ?? TourStatus.ACTIVE,
    featured: Boolean(input.featured),
    locationId: input.locationId,
    createdAt,
    updatedAt: createdAt,
  };
  state.tours.push(tour);
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
      title: `Ngày ${index + 1}: Trải nghiệm tại ${tour.location.name}`,
    })),
  }));

  const userMap = new Map(state.users.map((user) => [user.id, user]));
  const latestReviews = state.reviews
    .filter((review) => review.isVisible)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6)
    .map((review) => {
      const user = userMap.get(review.userId);
      const tour = allTours.find((item) => item.id === review.tourId);
      return {
        ...review,
        createdAt: toDate(review.createdAt),
        user: {
          fullName: user?.fullName ?? "Người dùng",
          avatarUrl: null,
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

  const relatedTours = tours.filter((item) => item.id !== tour.id && item.locationId === tour.locationId && item.status === TourStatus.ACTIVE).slice(0, 4);
  const viewerReview = userId ? state.reviews.find((review) => review.userId === userId && review.tourId === tour.id) : null;
  const viewerFavorite = Boolean(userId && state.favorites.some((favorite) => favorite.userId === userId && favorite.tourId === tour.id));

  return {
    tour: {
      ...tour,
      images: [
        { id: `${tour.id}_img_1`, imageUrl: tour.featuredImage, sortOrder: 1 },
        { id: `${tour.id}_img_2`, imageUrl: tour.location.imageUrl, sortOrder: 2 },
      ],
      itineraries: Array.from({ length: Math.max(2, Math.min(tour.durationDays, 5)) }).map((_, index) => ({
        id: `${tour.id}_it_${index + 1}`,
        dayNumber: index + 1,
        title: `Ngày ${index + 1}: Hoạt động tại ${tour.location.name}`,
        description: "Lịch trình chi tiết sẽ được điều phối theo thời tiết và nhóm khách.",
      })),
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
    .map((review) => {
      const tour = tours.find((item) => item.id === review.tourId);
      return {
        ...review,
        createdAt: toDate(review.createdAt),
        user: {
          fullName: userMap.get(review.userId)?.fullName ?? "Người dùng",
          avatarUrl: null,
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
      fullName: profile?.fullName ?? "Người dùng",
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
