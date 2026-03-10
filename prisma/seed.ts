import {
  BookingStatus,
  PaymentStatus,
  PrismaClient,
  TourStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  catalogLocations,
  catalogReviewComments,
  catalogTours,
  catalogTravelerProfiles,
  localAvatarPool,
} from "../src/lib/content/vietnam-catalog";

const prisma = new PrismaClient();

const bookingStatuses: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
];

const getTourPrice = (tour: { price: number; discountPrice: number | null }) =>
  tour.discountPrice ?? tour.price;
const bookingCode = (index: number) => `TB2026${String(index + 1).padStart(5, "0")}`;

async function main() {
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.itinerary.deleteMany();
  await prisma.tourImage.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const userPasswordHash = await bcrypt.hash("12345678", 10);

  await prisma.user.create({
    data: {
      fullName: "Quản trị viên hệ thống",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      phone: "0909000000",
      avatarUrl: localAvatarPool[0],
    },
  });

  await prisma.user.createMany({
    data: catalogTravelerProfiles.map((traveler, index) => ({
      fullName: traveler.fullName,
      email: traveler.email,
      passwordHash: userPasswordHash,
      phone: traveler.phone,
      avatarUrl: localAvatarPool[index % localAvatarPool.length],
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    })),
  });

  await prisma.location.createMany({
    data: catalogLocations.map((location) => ({
      name: location.name,
      slug: location.slug,
      provinceOrCity: location.provinceOrCity,
      country: location.country,
      shortDescription: location.shortDescription,
      description: location.description,
      imageUrl: location.imageUrl,
      gallery: location.gallery,
      featured: Boolean(location.featured),
    })),
  });

  const locations = await prisma.location.findMany();
  const locationMap = new Map(locations.map((location) => [location.slug, location.id]));

  await prisma.tour.createMany({
    data: catalogTours.map((tour) => ({
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
      status: tour.status === "INACTIVE" ? TourStatus.INACTIVE : TourStatus.ACTIVE,
      featured: Boolean(tour.featured),
      locationId: locationMap.get(tour.locationSlug)!,
    })),
  });

  const tours = await prisma.tour.findMany();
  const tourMap = new Map(tours.map((tour) => [tour.slug, tour]));

  await prisma.tourImage.createMany({
    data: catalogTours.flatMap((tour) => {
      const currentTour = tourMap.get(tour.slug);
      if (!currentTour) return [];
      return tour.gallery.map((imageUrl, index) => ({
        tourId: currentTour.id,
        imageUrl,
        sortOrder: index + 1,
      }));
    }),
  });

  await prisma.itinerary.createMany({
    data: catalogTours.flatMap((tour) => {
      const currentTour = tourMap.get(tour.slug);
      if (!currentTour) return [];
      return Array.from({ length: tour.durationDays }).map((_, index) => ({
        tourId: currentTour.id,
        dayNumber: index + 1,
        title: tour.itineraryTitles[index] ?? `Ngày ${index + 1}`,
        description:
          "Lịch trình tham quan, ăn uống và nghỉ ngơi được tối ưu theo từng nhóm khách.",
      }));
    }),
  });

  const users = await prisma.user.findMany({
    where: { role: UserRole.USER },
    orderBy: { email: "asc" },
  });

  const activeTours = tours.filter((tour) => tour.status === TourStatus.ACTIVE);

  const bookingCount = 48;
  await prisma.booking.createMany({
    data: Array.from({ length: bookingCount }).map((_, index) => {
      const user = users[index % users.length]!;
      const tour = activeTours[(index * 3) % activeTours.length]!;
      const guests = Math.min((index % 4) + 1, tour.maxGuests);
      const status = bookingStatuses[index % bookingStatuses.length]!;
      const paymentStatus =
        status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED
          ? PaymentStatus.PAID
          : PaymentStatus.UNPAID;

      return {
        bookingCode: bookingCode(index),
        userId: user.id,
        tourId: tour.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? "0909009999",
        numberOfGuests: guests,
        note: "Ưu tiên ghế gần nhau và hỗ trợ check-in nhanh.",
        totalPrice: getTourPrice(tour) * guests,
        status,
        paymentMethod: "Chuyển khoản ngân hàng",
        paymentStatus,
        departureDate: new Date(2026, index % 12, 8 + (index % 18)),
      };
    }),
  });

  const reviewData: {
    userId: string;
    tourId: string;
    rating: number;
    comment: string;
    isVisible: boolean;
  }[] = [];
  const reviewPairSet = new Set<string>();

  for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
    const user = users[userIndex]!;

    for (let round = 0; round < 2; round += 1) {
      const tour = activeTours[(userIndex * 2 + round * 5) % activeTours.length]!;
      const pairKey = `${user.id}_${tour.id}`;
      if (reviewPairSet.has(pairKey)) {
        continue;
      }
      reviewPairSet.add(pairKey);

      reviewData.push({
        userId: user.id,
        tourId: tour.id,
        rating: 5 - ((userIndex + round) % 3),
        comment: catalogReviewComments[(userIndex + round) % catalogReviewComments.length]!,
        isVisible: (userIndex + round) % 6 !== 0,
      });
    }
  }

  await prisma.review.createMany({ data: reviewData });

  const favoriteData: { userId: string; tourId: string }[] = [];
  const favoritePairSet = new Set<string>();
  for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
    const user = users[userIndex]!;
    for (let offset = 0; offset < 3; offset += 1) {
      const tour = activeTours[(userIndex * 2 + offset * 7) % activeTours.length]!;
      const pairKey = `${user.id}_${tour.id}`;
      if (favoritePairSet.has(pairKey)) continue;
      favoritePairSet.add(pairKey);
      favoriteData.push({ userId: user.id, tourId: tour.id });
    }
  }

  await prisma.favorite.createMany({
    data: favoriteData,
    skipDuplicates: true,
  });

  console.log("Seed thành công.");
  console.log(`Điểm đến: ${locations.length} | Tour: ${tours.length} | Booking: ${bookingCount}`);
  console.log(`Review: ${reviewData.length} | Favorite: ${favoriteData.length}`);
  console.log("Admin: admin@example.com / Admin@123");
  console.log("User mẫu: user1@example.com / 12345678");
}

main()
  .catch((error) => {
    console.error("Seed thất bại:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
