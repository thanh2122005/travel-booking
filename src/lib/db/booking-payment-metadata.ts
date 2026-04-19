import { db } from "@/lib/db/prisma";

type QueryExecutor = Pick<typeof db, "$queryRawUnsafe" | "$executeRawUnsafe">;

type BookingPaymentMetadataOptions = {
  strict?: boolean;
};

export type BookingPaymentMetadata = {
  paymentRequestedAt: Date | null;
  paymentVerifiedAt: Date | null;
  paymentVerifiedById: string | null;
  paymentVerifiedByName: string | null;
  ticketCode: string | null;
  checkInCode: string | null;
  ticketIssuedAt: Date | null;
};

type BookingPaymentMetadataRow = {
  bookingId: string;
  paymentRequestedAt?: Date | string | null;
  paymentVerifiedAt?: Date | string | null;
  paymentVerifiedById?: string | null;
  paymentVerifiedByName?: string | null;
  ticketCode?: string | null;
  checkInCode?: string | null;
  ticketIssuedAt?: Date | string | null;
};

export const emptyBookingPaymentMetadata: BookingPaymentMetadata = {
  paymentRequestedAt: null,
  paymentVerifiedAt: null,
  paymentVerifiedById: null,
  paymentVerifiedByName: null,
  ticketCode: null,
  checkInCode: null,
  ticketIssuedAt: null,
};

export class BookingPaymentMetadataMigrationError extends Error {
  constructor() {
    super("CSDL chưa cập nhật các cột thanh toán/vé cho booking.");
    this.name = "BookingPaymentMetadataMigrationError";
  }
}

export function isBookingPaymentMetadataColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Unknown column") ||
    message.includes("paymentRequestedAt") ||
    message.includes("paymentVerifiedAt") ||
    message.includes("paymentVerifiedById") ||
    message.includes("paymentVerifiedByName") ||
    message.includes("ticketCode") ||
    message.includes("checkInCode") ||
    message.includes("ticketIssuedAt")
  );
}

export function isBookingPaymentMetadataMigrationError(error: unknown) {
  return error instanceof BookingPaymentMetadataMigrationError;
}

function normalizeDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeRow(row?: BookingPaymentMetadataRow | null): BookingPaymentMetadata {
  return {
    paymentRequestedAt: normalizeDate(row?.paymentRequestedAt),
    paymentVerifiedAt: normalizeDate(row?.paymentVerifiedAt),
    paymentVerifiedById: row?.paymentVerifiedById ?? null,
    paymentVerifiedByName: row?.paymentVerifiedByName ?? null,
    ticketCode: row?.ticketCode ?? null,
    checkInCode: row?.checkInCode ?? null,
    ticketIssuedAt: normalizeDate(row?.ticketIssuedAt),
  };
}

export async function getBookingPaymentMetadataByIds(
  bookingIds: string[],
  executor: QueryExecutor = db,
  options: BookingPaymentMetadataOptions = {},
) {
  if (!bookingIds.length) {
    return new Map<string, BookingPaymentMetadata>();
  }

  const placeholders = bookingIds.map(() => "?").join(", ");
  const rows = (await executor
    .$queryRawUnsafe(
      `SELECT \`id\` AS \`bookingId\`, \`paymentRequestedAt\`, \`paymentVerifiedAt\`, \`paymentVerifiedById\`, \`paymentVerifiedByName\`, \`ticketCode\`, \`checkInCode\`, \`ticketIssuedAt\` FROM \`Booking\` WHERE \`id\` IN (${placeholders})`,
      ...bookingIds,
    )
    .catch((error) => {
      if (isBookingPaymentMetadataColumnError(error)) {
        if (options.strict) {
          throw new BookingPaymentMetadataMigrationError();
        }
        return [] as BookingPaymentMetadataRow[];
      }
      throw error;
    })) as BookingPaymentMetadataRow[];

  return new Map(rows.map((row) => [row.bookingId, normalizeRow(row)]));
}

export async function getBookingPaymentMetadata(
  bookingId: string,
  executor: QueryExecutor = db,
  options: BookingPaymentMetadataOptions = {},
) {
  const metadata = await getBookingPaymentMetadataByIds([bookingId], executor, options);
  return metadata.get(bookingId) ?? emptyBookingPaymentMetadata;
}

export async function attachBookingPaymentMetadata<T extends { id: string }>(
  bookings: T[],
  executor: QueryExecutor = db,
  options: BookingPaymentMetadataOptions = {},
): Promise<Array<T & BookingPaymentMetadata>> {
  const metadataById = await getBookingPaymentMetadataByIds(
    bookings.map((booking) => booking.id),
    executor,
    options,
  );

  return bookings.map((booking) => ({
    ...booking,
    ...(metadataById.get(booking.id) ?? emptyBookingPaymentMetadata),
  }));
}

export async function updateBookingPaymentMetadata(
  bookingId: string,
  payload: Partial<BookingPaymentMetadata>,
  executor: QueryExecutor = db,
) {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return;
  }

  const sql = entries.map(([key]) => `\`${key}\` = ?`).join(", ");
  const values = entries.map(([, value]) => value);

  await executor
    .$executeRawUnsafe(
      `UPDATE \`Booking\` SET ${sql}, \`updatedAt\` = CURRENT_TIMESTAMP(3) WHERE \`id\` = ?`,
      ...values,
      bookingId,
    )
    .catch((error) => {
      if (isBookingPaymentMetadataColumnError(error)) {
        throw new BookingPaymentMetadataMigrationError();
      }
      throw error;
    });
}
