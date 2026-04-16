import { BookingStatus, TourStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseDateParam(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const fromParam = parseDateParam(searchParams.get("from"));
  const guests = parseInt(searchParams.get("guests") ?? "0", 10);

  if (!fromParam || guests <= 0) {
    return NextResponse.json(
      { message: "Tham số 'from' hoặc 'guests' không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const tour = await db.tour.findUnique({
      where: { id },
      select: { maxGuests: true, status: true },
    });

    if (!tour || tour.status !== TourStatus.ACTIVE) {
      return NextResponse.json({ message: "Không tìm thấy tour." }, { status: 404 });
    }

    if (guests > tour.maxGuests) {
      return NextResponse.json({ alternatives: [] }); // Khách vượt sức chứa 1 tour thì vô vọng
    }

    const maxSearchDays = 15;
    const rangeStart = new Date(fromParam);
    rangeStart.setDate(rangeStart.getDate() - maxSearchDays);
    const rangeEnd = new Date(fromParam);
    rangeEnd.setDate(rangeEnd.getDate() + maxSearchDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actualStart = rangeStart < today ? today : rangeStart;

    const actualStartUtc = new Date(actualStart);
    actualStartUtc.setUTCHours(0, 0, 0, 0);
    const rangeEndUtc = new Date(rangeEnd);
    rangeEndUtc.setUTCDate(rangeEndUtc.getUTCDate() + 1);

    // Group bookings by date
    const bookings = await db.booking.groupBy({
      by: ["departureDate"],
      where: {
        tourId: id,
        status: { not: BookingStatus.CANCELLED },
        departureDate: { gte: actualStartUtc, lt: rangeEndUtc },
      },
      _sum: { numberOfGuests: true },
    });

    const bookedMap = new Map<string, number>();
    for (const b of bookings) {
      if (!b.departureDate) continue;
      const dateKey = b.departureDate.toISOString().slice(0, 10);
      bookedMap.set(dateKey, b._sum.numberOfGuests ?? 0);
    }

    const alternatives: { date: string; remainingSeats: number }[] = [];
    
    // Check everyday in the range
    let current = new Date(actualStart);
    while (current <= rangeEnd) {
      const dateStr = current.toISOString().slice(0, 10);
      const booked = bookedMap.get(dateStr) ?? 0;
      const remaining = Math.max(tour.maxGuests - booked, 0);

      if (remaining >= guests) {
        alternatives.push({ date: dateStr, remainingSeats: remaining });
      }

      current.setDate(current.getDate() + 1);
    }

    // Sort by proximity to 'fromParam'
    const targetTime = fromParam.getTime();
    alternatives.sort((a, b) => {
      const distA = Math.abs(new Date(a.date).getTime() - targetTime);
      const distB = Math.abs(new Date(b.date).getTime() - targetTime);
      return distA - distB;
    });

    return NextResponse.json({ alternatives: alternatives.slice(0, 5) });

  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ alternatives: [] }); // Fallback on db error
    }
    return NextResponse.json(
      { message: "Lỗi kiểm tra ngày thay thế." },
      { status: 500 },
    );
  }
}
