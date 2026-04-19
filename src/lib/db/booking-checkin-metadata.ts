import { db } from "@/lib/db/prisma";

type QueryExecutor = Pick<typeof db, "$queryRawUnsafe" | "$executeRawUnsafe">;

export type BookingCheckInMetadata = {
  checkedInAt: Date | null;
  checkedInById: string | null;
  checkedInByName: string | null;
};

type BookingCheckInRow = {
  bookingId: string;
  checkedInAt?: Date | string | null;
  checkedInById?: string | null;
  checkedInByName?: string | null;
};

export const emptyBookingCheckInMetadata: BookingCheckInMetadata = {
  checkedInAt: null,
  checkedInById: null,
  checkedInByName: null,
};

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeRow(row?: BookingCheckInRow | null): BookingCheckInMetadata {
  return {
    checkedInAt: normalizeDate(row?.checkedInAt),
    checkedInById: row?.checkedInById ?? null,
    checkedInByName: row?.checkedInByName ?? null,
  };
}

async function ensureBookingCheckinsTable(executor: QueryExecutor = db) {
  await executor.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS booking_checkins (
      booking_id VARCHAR(191) PRIMARY KEY,
      checked_in_at DATETIME(3) NULL,
      checked_in_by_id VARCHAR(191) NULL,
      checked_in_by_name VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_booking_checkins_checked_in_at (checked_in_at),
      CONSTRAINT fk_booking_checkins_booking
        FOREIGN KEY (booking_id) REFERENCES Booking(id)
        ON DELETE CASCADE
    )
  `);
}

export async function getBookingCheckInMetadataByIds(
  bookingIds: string[],
  executor: QueryExecutor = db,
) {
  if (!bookingIds.length) {
    return new Map<string, BookingCheckInMetadata>();
  }

  await ensureBookingCheckinsTable(executor);
  const placeholders = bookingIds.map(() => "?").join(", ");
  const rows = (await executor.$queryRawUnsafe(
    `
      SELECT
        booking_id AS bookingId,
        checked_in_at AS checkedInAt,
        checked_in_by_id AS checkedInById,
        checked_in_by_name AS checkedInByName
      FROM booking_checkins
      WHERE booking_id IN (${placeholders})
    `,
    ...bookingIds,
  )) as BookingCheckInRow[];

  return new Map(rows.map((row) => [row.bookingId, normalizeRow(row)]));
}

export async function attachBookingCheckInMetadata<T extends { id: string }>(
  bookings: T[],
  executor: QueryExecutor = db,
): Promise<Array<T & BookingCheckInMetadata>> {
  const metadataById = await getBookingCheckInMetadataByIds(
    bookings.map((booking) => booking.id),
    executor,
  );

  return bookings.map((booking) => ({
    ...booking,
    ...(metadataById.get(booking.id) ?? emptyBookingCheckInMetadata),
  }));
}

export async function getBookingCheckInMetadata(
  bookingId: string,
  executor: QueryExecutor = db,
) {
  const metadataById = await getBookingCheckInMetadataByIds([bookingId], executor);
  return metadataById.get(bookingId) ?? emptyBookingCheckInMetadata;
}

export async function markBookingCheckedIn(
  input: {
    bookingId: string;
    checkedInById?: string | null;
    checkedInByName?: string | null;
  },
  executor: QueryExecutor = db,
) {
  await ensureBookingCheckinsTable(executor);
  const now = new Date();

  await executor.$executeRawUnsafe(
    `
      INSERT INTO booking_checkins (
        booking_id,
        checked_in_at,
        checked_in_by_id,
        checked_in_by_name
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        checked_in_at = IF(checked_in_at IS NULL, VALUES(checked_in_at), checked_in_at),
        checked_in_by_id = IF(checked_in_at IS NULL, VALUES(checked_in_by_id), checked_in_by_id),
        checked_in_by_name = IF(checked_in_at IS NULL, VALUES(checked_in_by_name), checked_in_by_name)
    `,
    input.bookingId,
    now,
    input.checkedInById ?? null,
    input.checkedInByName ?? null,
  );

  const latest = await getBookingCheckInMetadata(input.bookingId, executor);
  return latest;
}

export async function clearBookingCheckInMetadata(
  bookingId: string,
  executor: QueryExecutor = db,
) {
  await ensureBookingCheckinsTable(executor);
  await executor.$executeRawUnsafe(
    `
      INSERT INTO booking_checkins (
        booking_id,
        checked_in_at,
        checked_in_by_id,
        checked_in_by_name
      )
      VALUES (?, NULL, NULL, NULL)
      ON DUPLICATE KEY UPDATE
        checked_in_at = NULL,
        checked_in_by_id = NULL,
        checked_in_by_name = NULL
    `,
    bookingId,
  );
}
