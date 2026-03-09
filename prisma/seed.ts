import {
  BookingStatus,
  PaymentStatus,
  PrismaClient,
  TourStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type LocationSeed = {
  name: string;
  slug: string;
  provinceOrCity: string;
  country: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  featured?: boolean;
};

type TourSeed = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice?: number;
  durationDays: number;
  durationNights: number;
  maxGuests: number;
  transportation: string;
  departureLocation: string;
  featuredImage: string;
  gallery: string[];
  featured?: boolean;
  status?: TourStatus;
  locationSlug: string;
  itineraryTitles: string[];
};

const locationSeeds: LocationSeed[] = [
  {
    name: "Da Nang",
    slug: "da-nang",
    provinceOrCity: "Da Nang",
    country: "Viet Nam",
    shortDescription: "Thanh pho bien hien dai va nang dong.",
    description: "Da Nang noi bat voi bai bien dep, am thuc phong phu va nhieu diem check-in.",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    name: "Da Lat",
    slug: "da-lat",
    provinceOrCity: "Lam Dong",
    country: "Viet Nam",
    shortDescription: "Thanh pho ngan hoa voi khi hau mat me.",
    description: "Da Lat phu hop cho nghi duong, tham quan va trai nghiem cafe dep.",
    imageUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    name: "Nha Trang",
    slug: "nha-trang",
    provinceOrCity: "Khanh Hoa",
    country: "Viet Nam",
    shortDescription: "Thien duong bien voi nhieu hoat dong vui choi.",
    description: "Nha Trang co bai bien dai, hai san tuoi va cac khu giai tri hap dan.",
    imageUrl:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1493244040629-496f6d136cc3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    name: "Phu Quoc",
    slug: "phu-quoc",
    provinceOrCity: "Kien Giang",
    country: "Viet Nam",
    shortDescription: "Dao ngoc voi bien xanh va resort cao cap.",
    description: "Phu Quoc phu hop cho nghi duong gia dinh va cap doi.",
    imageUrl:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    name: "Ha Noi",
    slug: "ha-noi",
    provinceOrCity: "Ha Noi",
    country: "Viet Nam",
    shortDescription: "Thu do ngan nam van hien voi am thuc dac sac.",
    description: "Ha Noi noi bat voi pho co, ho Hoan Kiem va van hoa lich su.",
    imageUrl:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526779259212-756e2f9f8c7f?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Ha Long",
    slug: "ha-long",
    provinceOrCity: "Quang Ninh",
    country: "Viet Nam",
    shortDescription: "Di san thien nhien the gioi voi canh quan ky vi.",
    description: "Ha Long noi tieng voi hanh trinh du thuyen va hang dong dep.",
    imageUrl:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Hoi An",
    slug: "hoi-an",
    provinceOrCity: "Quang Nam",
    country: "Viet Nam",
    shortDescription: "Pho co dep va nhieu gia tri van hoa.",
    description: "Hoi An thich hop cho du lich van hoa va an uong.",
    imageUrl:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Sa Pa",
    slug: "sa-pa",
    provinceOrCity: "Lao Cai",
    country: "Viet Nam",
    shortDescription: "Vung nui dep voi ruong bac thang va may mu.",
    description: "Sa Pa thu hut du khach boi canh quan hung vi va van hoa ban dia.",
    imageUrl:
      "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

const tourSeeds: TourSeed[] = [
  {
    title: "Kham pha Da Nang - Hoi An 4N3D",
    slug: "kham-pha-da-nang-hoi-an-4n3d",
    shortDescription: "Bien xanh, pho co va am thuc mien Trung.",
    description: "Tour ket hop Da Nang va Hoi An, lich trinh can bang nghi duong va tham quan.",
    price: 4900000,
    discountPrice: 4390000,
    durationDays: 4,
    durationNights: 3,
    maxGuests: 20,
    transportation: "May bay + xe du lich",
    departureLocation: "TP. Ho Chi Minh",
    featuredImage:
      "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
    locationSlug: "da-nang",
    itineraryTitles: ["Don khach", "Ba Na Hills", "Pho co Hoi An", "Ket thuc"],
  },
  {
    title: "Da Lat San May 3N2D",
    slug: "da-lat-san-may-3n2d",
    shortDescription: "Tour chill nhe voi nhieu diem check-in dep.",
    description: "Da Lat mat me, phu hop cho nhom ban tre va cap doi.",
    price: 3290000,
    discountPrice: 2990000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 18,
    transportation: "Xe giuong nam",
    departureLocation: "TP. Ho Chi Minh",
    featuredImage:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
    locationSlug: "da-lat",
    itineraryTitles: ["Khoi hanh", "Tham quan", "Ket thuc"],
  },
  {
    title: "Nha Trang Bien Xanh 3N2D",
    slug: "nha-trang-bien-xanh-3n2d",
    shortDescription: "Nghi duong bien dao va thuong thuc hai san.",
    description: "Tour gia dinh voi lich trinh nhe, diem den noi bat tai Nha Trang.",
    price: 3690000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 25,
    transportation: "May bay + xe du lich",
    departureLocation: "Ha Noi",
    featuredImage:
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493244040629-496f6d136cc3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80",
    ],
    locationSlug: "nha-trang",
    itineraryTitles: ["Don khach", "Kham pha dao", "Ket thuc"],
  },
  {
    title: "Phu Quoc Nghi Duong 4N3D",
    slug: "phu-quoc-nghi-duong-4n3d",
    shortDescription: "Ky nghi tai dao ngoc voi resort cao cap.",
    description: "Tour nghi duong phu hop cap doi va gia dinh.",
    price: 6290000,
    discountPrice: 5890000,
    durationDays: 4,
    durationNights: 3,
    maxGuests: 16,
    transportation: "May bay + xe du lich",
    departureLocation: "TP. Ho Chi Minh",
    featuredImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
    locationSlug: "phu-quoc",
    itineraryTitles: ["Check-in", "Kham pha", "Tam bien", "Ket thuc"],
  },
  {
    title: "Ha Noi - Ninh Binh 3N2D",
    slug: "ha-noi-ninh-binh-3n2d",
    shortDescription: "Hanh trinh van hoa va am thuc mien Bac.",
    description: "Ket hop tham quan Ha Noi va danh thang Ninh Binh.",
    price: 3590000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 22,
    transportation: "Xe du lich",
    departureLocation: "Ha Noi",
    featuredImage:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1526779259212-756e2f9f8c7f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
    ],
    locationSlug: "ha-noi",
    itineraryTitles: ["Pho co", "Ninh Binh", "Ket thuc"],
  },
  {
    title: "Du Thuyen Ha Long 2N1D",
    slug: "du-thuyen-ha-long-2n1d",
    shortDescription: "Ngu dem tren du thuyen tai Vinh Ha Long.",
    description: "Trai nghiem cao cap voi phong canh dep va dich vu tot.",
    price: 4490000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 30,
    transportation: "Xe limousine",
    departureLocation: "Ha Noi",
    featuredImage:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
    locationSlug: "ha-long",
    itineraryTitles: ["Khoi hanh", "Ket thuc"],
  },
  {
    title: "Hoi An Co Kinh 2N1D",
    slug: "hoi-an-co-kinh-2n1d",
    shortDescription: "Dao pho co va thuong thuc dac san.",
    description: "Tour ngan ngay de trai nghiem van hoa Hoi An.",
    price: 2490000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 20,
    transportation: "Xe du lich",
    departureLocation: "Da Nang",
    featuredImage:
      "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80",
    ],
    locationSlug: "hoi-an",
    itineraryTitles: ["Pho co", "Ket thuc"],
  },
  {
    title: "Sa Pa Fansipan 3N2D",
    slug: "sa-pa-fansipan-3n2d",
    shortDescription: "San may va tham quan ban lang Tay Bac.",
    description: "Tour noi bat voi canh quan vung cao va trai nghiem ban dia.",
    price: 3890000,
    discountPrice: 3590000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 15,
    transportation: "Xe cabin",
    departureLocation: "Ha Noi",
    featuredImage:
      "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    ],
    locationSlug: "sa-pa",
    itineraryTitles: ["Khoi hanh", "Fansipan", "Ket thuc"],
  },
  {
    title: "Da Nang Teambuilding 3N2D",
    slug: "da-nang-teambuilding-3n2d",
    shortDescription: "Goi tour cho doanh nghiep va nhom lon.",
    description: "Lich trinh linh hoat ket hop teambuilding va gala dinner.",
    price: 4290000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 40,
    transportation: "May bay + xe du lich",
    departureLocation: "Ha Noi",
    featuredImage:
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1200&q=80",
    ],
    locationSlug: "da-nang",
    itineraryTitles: ["Don doan", "Teambuilding", "Ket thuc"],
  },
  {
    title: "Phu Quoc Premium 5N4D",
    slug: "phu-quoc-premium-5n4d",
    shortDescription: "Ky nghi dai ngay voi dich vu cao cap.",
    description: "Tour phu hop cap doi va gia dinh muon nghi duong thuc su.",
    price: 8990000,
    discountPrice: 8390000,
    durationDays: 5,
    durationNights: 4,
    maxGuests: 12,
    transportation: "May bay + xe rieng",
    departureLocation: "TP. Ho Chi Minh",
    featuredImage:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
    status: TourStatus.INACTIVE,
    locationSlug: "phu-quoc",
    itineraryTitles: ["Check-in", "Nghi duong", "Bien dao", "Spa", "Ket thuc"],
  },
];

const getTourPrice = (tour: TourSeed) => tour.discountPrice ?? tour.price;
const bookingCode = (index: number) => `TB2026${String(index + 1).padStart(4, "0")}`;

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
      fullName: "Quan tri vien he thong",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      phone: "0909000001",
      avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=admin",
    },
  });

  await prisma.user.createMany({
    data: Array.from({ length: 10 }).map((_, index) => {
      const order = index + 1;
      return {
        fullName: `Nguoi dung ${order}`,
        email: `user${order}@example.com`,
        passwordHash: userPasswordHash,
        phone: `09090000${String(order).padStart(2, "0")}`,
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=user${order}`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      };
    }),
  });

  await prisma.location.createMany({ data: locationSeeds });
  const locations = await prisma.location.findMany();
  const locationMap = new Map(locations.map((location) => [location.slug, location.id]));

  await prisma.tour.createMany({
    data: tourSeeds.map((tour) => ({
      title: tour.title,
      slug: tour.slug,
      shortDescription: tour.shortDescription,
      description: tour.description,
      price: tour.price,
      discountPrice: tour.discountPrice,
      durationDays: tour.durationDays,
      durationNights: tour.durationNights,
      maxGuests: tour.maxGuests,
      transportation: tour.transportation,
      departureLocation: tour.departureLocation,
      featuredImage: tour.featuredImage,
      status: tour.status ?? TourStatus.ACTIVE,
      featured: tour.featured ?? false,
      locationId: locationMap.get(tour.locationSlug)!,
    })),
  });

  const tours = await prisma.tour.findMany();
  const tourMap = new Map(tours.map((tour) => [tour.slug, tour]));

  await prisma.tourImage.createMany({
    data: tourSeeds.flatMap((tour) => {
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
    data: tourSeeds.flatMap((tour) => {
      const currentTour = tourMap.get(tour.slug);
      if (!currentTour) return [];
      return Array.from({ length: tour.durationDays }).map((_, index) => ({
        tourId: currentTour.id,
        dayNumber: index + 1,
        title: tour.itineraryTitles[index] ?? `Ngay ${index + 1}`,
        description: "Lich trinh tham quan, an uong va nghi ngoi hop ly.",
      }));
    }),
  });

  const users = await prisma.user.findMany({
    where: { role: UserRole.USER },
    orderBy: { email: "asc" },
  });

  const bookingPairs = [
    { userEmail: "user1@example.com", tourSlug: "kham-pha-da-nang-hoi-an-4n3d", guests: 2 },
    { userEmail: "user2@example.com", tourSlug: "da-lat-san-may-3n2d", guests: 3 },
    { userEmail: "user3@example.com", tourSlug: "nha-trang-bien-xanh-3n2d", guests: 2 },
    { userEmail: "user4@example.com", tourSlug: "phu-quoc-nghi-duong-4n3d", guests: 4 },
    { userEmail: "user5@example.com", tourSlug: "ha-noi-ninh-binh-3n2d", guests: 2 },
    { userEmail: "user6@example.com", tourSlug: "du-thuyen-ha-long-2n1d", guests: 2 },
    { userEmail: "user7@example.com", tourSlug: "hoi-an-co-kinh-2n1d", guests: 1 },
    { userEmail: "user8@example.com", tourSlug: "sa-pa-fansipan-3n2d", guests: 2 },
  ];

  const statuses: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ];

  await prisma.booking.createMany({
    data: bookingPairs.map((pair, index) => {
      const user = users.find((item) => item.email === pair.userEmail)!;
      const tour = tourMap.get(pair.tourSlug)!;
      const sourceTour = tourSeeds.find((item) => item.slug === pair.tourSlug)!;
      const status = statuses[index % statuses.length];
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
        phone: user.phone ?? "0909000099",
        numberOfGuests: pair.guests,
        note: "Yeu cau phong view dep neu co.",
        totalPrice: getTourPrice(sourceTour) * pair.guests,
        status,
        paymentMethod: "Chuyen khoan ngan hang",
        paymentStatus,
        departureDate: new Date(2026, 4 + (index % 3), 10 + index),
      };
    }),
  });

  const reviewSeeds = [
    {
      userEmail: "user1@example.com",
      tourSlug: "kham-pha-da-nang-hoi-an-4n3d",
      rating: 5,
      comment: "Tour rat tot, huong dan vien nhiet tinh.",
    },
    {
      userEmail: "user2@example.com",
      tourSlug: "da-lat-san-may-3n2d",
      rating: 4,
      comment: "Lich trinh hop ly va gia ca on.",
    },
    {
      userEmail: "user3@example.com",
      tourSlug: "nha-trang-bien-xanh-3n2d",
      rating: 5,
      comment: "Bien dep, do an ngon, se quay lai.",
    },
    {
      userEmail: "user4@example.com",
      tourSlug: "phu-quoc-nghi-duong-4n3d",
      rating: 4,
      comment: "Resort dep, nghi duong thoai mai.",
    },
    {
      userEmail: "user5@example.com",
      tourSlug: "du-thuyen-ha-long-2n1d",
      rating: 5,
      comment: "Trai nghiem du thuyen dang gia.",
    },
  ];

  await prisma.review.createMany({
    data: reviewSeeds.map((review, index) => {
      const user = users.find((item) => item.email === review.userEmail)!;
      const tour = tourMap.get(review.tourSlug)!;
      return {
        userId: user.id,
        tourId: tour.id,
        rating: review.rating,
        comment: review.comment,
        isVisible: index % 4 !== 3,
      };
    }),
  });

  const favoriteSeeds = [
    { userEmail: "user1@example.com", tourSlug: "phu-quoc-nghi-duong-4n3d" },
    { userEmail: "user1@example.com", tourSlug: "du-thuyen-ha-long-2n1d" },
    { userEmail: "user2@example.com", tourSlug: "sa-pa-fansipan-3n2d" },
    { userEmail: "user3@example.com", tourSlug: "kham-pha-da-nang-hoi-an-4n3d" },
    { userEmail: "user4@example.com", tourSlug: "da-lat-san-may-3n2d" },
    { userEmail: "user5@example.com", tourSlug: "ha-noi-ninh-binh-3n2d" },
  ];

  await prisma.favorite.createMany({
    data: favoriteSeeds.map((item) => {
      const user = users.find((candidate) => candidate.email === item.userEmail)!;
      const tour = tourMap.get(item.tourSlug)!;
      return { userId: user.id, tourId: tour.id };
    }),
    skipDuplicates: true,
  });

  console.log("Seed thanh cong.");
  console.log("Admin: admin@example.com / Admin@123");
  console.log("User mau: user1@example.com / 12345678");
}

main()
  .catch((error) => {
    console.error("Seed that bai:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
