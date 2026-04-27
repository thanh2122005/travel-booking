const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

function toDate(v) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function main() {
  const filePath = path.join(process.cwd(), '.data', 'admin-demo.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  const userPasswordHash = await bcrypt.hash('12345678', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['booking_activity_logs','admin_activity_logs','Favorite','Review','Booking','Itinerary','TourImage','ContactInquiry','Tour','Location','NewsletterSubscriber','User']) {
      try {
        await tx.$executeRawUnsafe(`TRUNCATE TABLE ${table}`);
      } catch {}
    }
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

    const users = (data.users || []).map((u) => ({
      id: u.id,
      fullName: u.fullName || 'Nguoi dung',
      email: u.email,
      passwordHash: u.role === 'ADMIN' ? adminPasswordHash : userPasswordHash,
      avatarUrl: u.avatarUrl || null,
      phone: u.phone || null,
      role: u.role === 'ADMIN' ? 'ADMIN' : 'USER',
      status: u.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
      createdAt: toDate(u.createdAt) || new Date(),
      updatedAt: toDate(u.updatedAt) || new Date(),
    })).filter((u) => !!u.email);
    if (users.length) await tx.user.createMany({ data: users, skipDuplicates: true });

    const locations = (data.locations || []).map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      provinceOrCity: l.provinceOrCity || '',
      country: l.country || 'Viet Nam',
      shortDescription: l.shortDescription || '',
      description: l.description || '',
      imageUrl: l.imageUrl || '',
      gallery: Array.isArray(l.gallery) ? l.gallery : [],
      featured: !!l.featured,
      createdAt: toDate(l.createdAt) || new Date(),
      updatedAt: toDate(l.updatedAt) || new Date(),
    }));
    if (locations.length) await tx.location.createMany({ data: locations, skipDuplicates: true });

    const locationIds = new Set(locations.map((x) => x.id));

    const tours = (data.tours || []).filter((t) => locationIds.has(t.locationId)).map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      shortDescription: t.shortDescription || '',
      description: t.description || '',
      price: Number(t.price || 0),
      discountPrice: t.discountPrice == null ? null : Number(t.discountPrice),
      durationDays: Number(t.durationDays || 1),
      durationNights: Number(t.durationNights || 0),
      singleRoomSurchargePerAdult: Number(t.singleRoomSurchargePerAdult || 0),
      maxGuests: Number(t.maxGuests || 1),
      transportation: t.transportation || 'Xe du lich',
      departureLocation: t.departureLocation || '',
      featuredImage: t.featuredImage || '',
      status: t.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      featured: !!t.featured,
      locationId: t.locationId,
      createdAt: toDate(t.createdAt) || new Date(),
      updatedAt: toDate(t.updatedAt) || new Date(),
    }));
    if (tours.length) await tx.tour.createMany({ data: tours, skipDuplicates: true });

    const tourIds = new Set(tours.map((x) => x.id));

    const tourImages = (data.tourImages || []).filter((i) => tourIds.has(i.tourId)).map((i, idx) => ({
      id: i.id || `img_${idx}_${Date.now()}`,
      tourId: i.tourId,
      imageUrl: i.imageUrl || '',
      sortOrder: Number(i.sortOrder || 0),
    }));
    if (tourImages.length) await tx.tourImage.createMany({ data: tourImages, skipDuplicates: true });

    const itineraries = (data.itineraries || []).filter((it) => tourIds.has(it.tourId)).map((it, idx) => ({
      id: it.id || `it_${idx}_${Date.now()}`,
      tourId: it.tourId,
      dayNumber: Number(it.dayNumber || 1),
      title: it.title || `Ngay ${Number(it.dayNumber || 1)}`,
      description: it.description || '',
    }));
    if (itineraries.length) await tx.itinerary.createMany({ data: itineraries, skipDuplicates: true });

    const userIds = new Set(users.map((x) => x.id));

    const bookings = (data.bookings || [])
      .filter((b) => userIds.has(b.userId) && tourIds.has(b.tourId))
      .map((b) => ({
        id: b.id,
        bookingCode: b.bookingCode,
        userId: b.userId,
        tourId: b.tourId,
        fullName: b.fullName || '',
        email: b.email || '',
        phone: b.phone || '',
        numberOfGuests: Number(b.numberOfGuests || 1),
        note: b.note || null,
        totalPrice: Number(b.totalPrice || 0),
        status: ['PENDING','CONFIRMED','CANCELLED','COMPLETED'].includes(b.status) ? b.status : 'PENDING',
        paymentMethod: b.paymentMethod || 'Thanh toan khi xac nhan',
        paymentStatus: b.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
        departureDate: toDate(b.departureDate) || null,
        createdAt: toDate(b.createdAt) || new Date(),
        updatedAt: toDate(b.updatedAt) || new Date(),
      }));
    if (bookings.length) await tx.booking.createMany({ data: bookings, skipDuplicates: true });

    const reviews = (data.reviews || [])
      .filter((r) => userIds.has(r.userId) && tourIds.has(r.tourId))
      .map((r) => ({
        id: r.id,
        userId: r.userId,
        tourId: r.tourId,
        rating: Math.max(1, Math.min(5, Number(r.rating || 5))),
        comment: r.comment || '',
        isVisible: r.isVisible !== false,
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date(),
      }));
    if (reviews.length) await tx.review.createMany({ data: reviews, skipDuplicates: true });

    const favorites = (data.favorites || [])
      .filter((f) => userIds.has(f.userId) && tourIds.has(f.tourId))
      .map((f) => ({
        id: f.id,
        userId: f.userId,
        tourId: f.tourId,
        createdAt: toDate(f.createdAt) || new Date(),
      }));
    if (favorites.length) await tx.favorite.createMany({ data: favorites, skipDuplicates: true });
  }, { timeout: 120000 });

  const [u, l, t, b, r] = await Promise.all([
    db.user.count(),
    db.location.count(),
    db.tour.count(),
    db.booking.count(),
    db.review.count(),
  ]);
  console.log(JSON.stringify({ users: u, locations: l, tours: t, bookings: b, reviews: r }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
