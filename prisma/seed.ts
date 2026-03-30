import {
  BookingStatus,
  InquiryStatus,
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

const consultationMessages = [
  "Mình cần lịch trình nhẹ nhàng cho gia đình có trẻ nhỏ.",
  "Tư vấn giúp gói tour trăng mật 4 ngày 3 đêm, ưu tiên resort đẹp.",
  "Nhóm mình 6 người muốn tour trải nghiệm ẩm thực địa phương.",
  "Cho mình phương án tour kết hợp nghỉ dưỡng và check-in cảnh đẹp.",
  "Mình cần tour có xe đưa đón sân bay và khách sạn trung tâm.",
  "Tư vấn giúp tour phù hợp ngân sách khoảng 5 triệu/người.",
  "Bên mình muốn tour team building, cần lịch trình linh hoạt.",
  "Mình cần tour đi cuối tuần, khởi hành từ TP.HCM.",
];

const newsletterSampleEmails = [
  "ngoclinh.travel@gmail.com",
  "huynhbao.booking@gmail.com",
  "lananh.explore@gmail.com",
  "quocviet.trips@gmail.com",
  "trangpham.vietnam@gmail.com",
  "minhthu.weekend@gmail.com",
  "hoangnam.tour@gmail.com",
  "myduyen.plan@gmail.com",
  "vinhnguyen.go@gmail.com",
  "lethao.travelnote@gmail.com",
  "phuonganh.vacation@gmail.com",
  "ducanh.route@gmail.com",
];

const getTourPrice = (tour: { price: number; discountPrice: number | null }) =>
  tour.discountPrice ?? tour.price;

const bookingCode = (index: number) => `TB2026${String(index + 1).padStart(5, "0")}`;
const inquiryCode = (index: number) => `TV2026${String(index + 1).padStart(5, "0")}`;

function daysAgo(days: number, hour = 9, minute = 0) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function daysAhead(days: number, hour = 8, minute = 0) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, minute, 0, 0);
  return value;
}

async function main() {
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.contactInquiry.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
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
  const locationGalleryMap = new Map(
    catalogLocations.map((location) => [location.slug, location.gallery]),
  );

  await prisma.tourImage.createMany({
    data: catalogTours.flatMap((tour) => {
      const currentTour = tourMap.get(tour.slug);
      if (!currentTour) return [];

      const baseGallery = Array.from(new Set([tour.featuredImage, ...tour.gallery].filter(Boolean)));
      const locationGallery = (locationGalleryMap.get(tour.locationSlug) ?? []).filter(
        (image) => !baseGallery.includes(image),
      );
      const mergedGallery = [...baseGallery, ...locationGallery].slice(0, 8);

      return mergedGallery.map((imageUrl, index) => ({
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
        description: index === 0 
          ? "Xe và Hướng dẫn viên đón quý khách tại điểm hẹn, bắt đầu hành trình. Nhận phòng khách sạn, nghỉ ngơi sau chuyến đi dài và bắt đầu khởi hành tham quan các địa danh nổi tiếng với nhiều hoạt động thú vị."
          : index === tour.durationDays - 1
          ? "Quý khách tự do sinh hoạt, tham quan mua sắm các đặc sản địa phương về làm quà cho người thân, bạn bè. Thu dọn hành lý chuẩn bị làm thủ tục trả phòng, xe đưa đoàn ra điểm hẹn kết thúc chuyến đi tốt đẹp."
          : "Trọn vẹn một ngày dấn thân khám phá các tuyệt cảnh, tham gia các hoạt động vui chơi giải trí bất tận. Quý khách còn có thời gian tự do hòa mình vào không gian văn hoá, trải nghiệm tinh hoa ẩm thực bản địa độc đáo.",
      }));
    }),
  });

  const users = await prisma.user.findMany({
    where: { role: UserRole.USER },
    orderBy: { email: "asc" },
  });
  const activeTours = tours.filter((tour) => tour.status === TourStatus.ACTIVE);

  const bookingCount = Math.max(220, activeTours.length * 12);
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

      const createdAt = daysAgo((index * 2) % 340, 8 + (index % 10), (index * 7) % 60);

      return {
        bookingCode: bookingCode(index),
        userId: user.id,
        tourId: tour.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? "0909009999",
        numberOfGuests: guests,
        note: "Ưu tiên chỗ ngồi gần nhau, hỗ trợ check-in sớm nếu có thể.",
        totalPrice: getTourPrice(tour) * guests,
        status,
        paymentMethod: "Chuyển khoản ngân hàng",
        paymentStatus,
        departureDate: daysAhead((index % 120) + 7, 7, 30),
        createdAt,
        updatedAt: createdAt,
      };
    }),
  });

  const reviewData: {
    userId: string;
    tourId: string;
    rating: number;
    comment: string;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  const reviewPairSet = new Set<string>();

  for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
    const user = users[userIndex]!;

    for (let round = 0; round < 4; round += 1) {
      const tour = activeTours[(userIndex * 3 + round * 7) % activeTours.length]!;
      const pairKey = `${user.id}_${tour.id}`;
      if (reviewPairSet.has(pairKey)) continue;
      reviewPairSet.add(pairKey);

      const createdAt = daysAgo((userIndex * 11 + round * 5) % 260, 10, 15);

      reviewData.push({
        userId: user.id,
        tourId: tour.id,
        rating: 5 - ((userIndex + round) % 3),
        comment: catalogReviewComments[(userIndex + round) % catalogReviewComments.length]!,
        isVisible: (userIndex + round) % 7 !== 0,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  await prisma.review.createMany({ data: reviewData });

  const favoriteData: { userId: string; tourId: string }[] = [];
  const favoritePairSet = new Set<string>();
  for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
    const user = users[userIndex]!;

    for (let offset = 0; offset < 6; offset += 1) {
      const tour = activeTours[(userIndex * 3 + offset * 11) % activeTours.length]!;
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

  const inquiryCount = 20;
  await prisma.contactInquiry.createMany({
    data: Array.from({ length: inquiryCount }).map((_, index) => {
      const user = users[(index * 2) % users.length]!;
      const tour = activeTours[(index * 5) % activeTours.length]!;
      const createdAt = daysAgo((index * 4) % 180, 9 + (index % 5), 20);
      const isResolved = index % 3 === 0;

      return {
        referenceCode: inquiryCode(index),
        fullName: user.fullName,
        phone: user.phone ?? "0909555666",
        email: user.email,
        tourId: tour.id,
        departureDate: daysAhead((index % 90) + 10, 8, 0),
        numberOfGuests: (index % 5) + 1,
        message: consultationMessages[index % consultationMessages.length]!,
        status: isResolved ? InquiryStatus.RESOLVED : InquiryStatus.PENDING,
        createdAt,
        updatedAt: createdAt,
      };
    }),
  });

  await prisma.newsletterSubscriber.createMany({
    data: newsletterSampleEmails.map((email, index) => ({
      email,
      createdAt: daysAgo((index + 1) * 3, 7 + (index % 4), 5),
    })),
    skipDuplicates: true,
  });

  console.log("Seed thành công.");
  console.log(`Điểm đến: ${locations.length} | Tour: ${tours.length} | Booking: ${bookingCount}`);
  console.log(`Review: ${reviewData.length} | Favorite: ${favoriteData.length}`);
  console.log(`Tư vấn: ${inquiryCount} | Newsletter: ${newsletterSampleEmails.length}`);
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
