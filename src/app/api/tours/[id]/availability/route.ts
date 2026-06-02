import { BookingStatus, TourStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";
import { demoGetTourAvailability } from "@/lib/demo/admin-demo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseDepartureDate(value: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toDateKeyUtc7(value: Date) {
  const shifted = new Date(value.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function getUtc7DayRange(date: Date) {
  const dayKey = toDateKeyUtc7(date);
  const [year, month, day] = dayKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

// LUỒNG KIỂM TRA CHỖ TRỐNG (Phục vụ trả lời câu hỏi bảo vệ)
// 1. Nhận `tourId` từ params và `departureDate` từ query string.
// 2. Validate ngày khởi hành hợp lệ (không quá khứ).
// 3. Query tổng số khách đã đặt (bookedGuests) trong bảng Booking khớp với tourId và ngày đi (status != CANCELLED).
// 4. Lấy `maxGuests` của Tour trừ đi `bookedGuests` để ra số chỗ còn lại (`remainingSeats`).
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const departureDate = parseDepartureDate(searchParams.get("departureDate"));

  if (!departureDate) {
    return NextResponse.json(
      { message: "Thiếu hoặc sai định dạng departureDate." },
      { status: 400 },
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (departureDate < today) {
    return NextResponse.json(
      { message: "Ngày khởi hành phải từ hôm nay trở đi." },
      { status: 400 },
    );
  }

  try {
    const tour = await db.tour.findUnique({
      where: { id },
      select: {
        id: true,
        maxGuests: true,
        status: true,
      },
    });

    if (!tour || tour.status !== TourStatus.ACTIVE) {
      return NextResponse.json({ message: "Không tìm thấy tour." }, { status: 404 });
    }

    const { start, end } = getUtc7DayRange(departureDate);
    const occupied = await db.booking.aggregate({
      where: {
        tourId: tour.id,
        status: {
          not: BookingStatus.CANCELLED,
        },
        departureDate: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        numberOfGuests: true,
      },
    });
    const bookedGuests = occupied._sum.numberOfGuests ?? 0;
    const remainingSeats = Math.max(tour.maxGuests - bookedGuests, 0);

    return NextResponse.json({
      tourId: tour.id,
      departureDate: departureDate.toISOString(),
      maxGuests: tour.maxGuests,
      bookedGuests,
      remainingSeats,
      isFull: remainingSeats <= 0,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const fallback = await demoGetTourAvailability({
        tourId: id,
        departureDate: departureDate.toISOString(),
      });
      if (!fallback) {
        return NextResponse.json({ message: "Không tìm thấy tour." }, { status: 404 });
      }
      return NextResponse.json(fallback);
    }

    return NextResponse.json(
      { message: "Không thể kiểm tra chỗ trống lúc này." },
      { status: 500 },
    );
  }
}
