import { randomUUID } from "crypto";
import { db } from "@/lib/db/prisma";

type QueryExecutor = Pick<typeof db, "$queryRawUnsafe" | "$executeRawUnsafe">;

export type BookingActivityAction =
  | "BOOKING_STATUS_UPDATED"
  | "BOOKING_PAYMENT_UPDATED"
  | "BOOKING_TICKET_ISSUED"
  | "BOOKING_CHECKED_IN"
  | "BOOKING_DETAIL_UPDATED";

export type BookingActivityLog = {
  id: string;
  bookingId: string;
  action: BookingActivityAction;
  actorId: string | null;
  actorName: string | null;
  detailJson: string | null;
  createdAt: Date;
};

type BookingActivityLogRow = {
  id: string;
  bookingId: string;
  action: BookingActivityAction;
  actorId?: string | null;
  actorName?: string | null;
  detailJson?: string | null;
  createdAt?: Date | string | null;
};

export async function ensureBookingActivityLogTable(executor: QueryExecutor = db) {
  await executor.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS booking_activity_logs (
      id VARCHAR(191) PRIMARY KEY,
      booking_id VARCHAR(191) NOT NULL,
      action VARCHAR(80) NOT NULL,
      actor_id VARCHAR(191) NULL,
      actor_name VARCHAR(191) NULL,
      detail_json LONGTEXT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_booking_activity_logs_booking_created (booking_id, created_at),
      INDEX idx_booking_activity_logs_action_created (action, created_at),
      CONSTRAINT fk_booking_activity_logs_booking
        FOREIGN KEY (booking_id) REFERENCES Booking(id)
        ON DELETE CASCADE
    )
  `);
}

function normalizeDate(value?: Date | string | null) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeRow(row: BookingActivityLogRow): BookingActivityLog {
  return {
    id: row.id,
    bookingId: row.bookingId,
    action: row.action,
    actorId: row.actorId ?? null,
    actorName: row.actorName ?? null,
    detailJson: row.detailJson ?? null,
    createdAt: normalizeDate(row.createdAt),
  };
}

export async function appendBookingActivityLog(
  input: {
    bookingId: string;
    action: BookingActivityAction;
    actorId?: string | null;
    actorName?: string | null;
    detail?: Record<string, unknown> | null;
  },
  executor: QueryExecutor = db,
) {
  await ensureBookingActivityLogTable(executor);
  const detailJson =
    input.detail === undefined || input.detail === null ? null : JSON.stringify(input.detail);

  await executor.$executeRawUnsafe(
    `
      INSERT INTO booking_activity_logs (
        id,
        booking_id,
        action,
        actor_id,
        actor_name,
        detail_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    input.bookingId,
    input.action,
    input.actorId ?? null,
    input.actorName ?? null,
    detailJson,
  );
}

export async function getBookingActivityLogs(
  bookingId: string,
  executor: QueryExecutor = db,
  limit = 100,
) {
  await ensureBookingActivityLogTable(executor);
  const rows = (await executor.$queryRawUnsafe(
    `
      SELECT
        id,
        booking_id AS bookingId,
        action,
        actor_id AS actorId,
        actor_name AS actorName,
        detail_json AS detailJson,
        created_at AS createdAt
      FROM booking_activity_logs
      WHERE booking_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
    bookingId,
    Math.max(1, Math.min(limit, 500)),
  )) as BookingActivityLogRow[];

  return rows.map(normalizeRow);
}

export async function getAdminBookingActivityLogs(input: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  await ensureBookingActivityLogTable(db);
  const page = Math.max(input.page ?? 1, 1);
  const pageSize = Math.min(Math.max(input.pageSize ?? 30, 1), 200);
  const search = input.search?.trim() ?? "";
  const pattern = `%${search}%`;

  const whereSql = search
    ? "WHERE (b.bookingCode LIKE ? OR l.action LIKE ? OR COALESCE(l.actor_name, '') LIKE ? OR COALESCE(l.detail_json, '') LIKE ?)"
    : "";
  const whereParams = search ? [pattern, pattern, pattern, pattern] : [];

  const countRows = (await db.$queryRawUnsafe(
    `
      SELECT COUNT(*) AS total
      FROM booking_activity_logs l
      LEFT JOIN Booking b ON b.id = l.booking_id
      ${whereSql}
    `,
    ...whereParams,
  )) as Array<{ total: number | bigint }>;
  const total = Number(countRows[0]?.total ?? 0);
  const offset = (page - 1) * pageSize;

  const rows = (await db.$queryRawUnsafe(
    `
      SELECT
        l.id,
        l.booking_id AS bookingId,
        b.bookingCode AS bookingCode,
        l.action,
        l.actor_id AS actorId,
        l.actor_name AS actorName,
        l.detail_json AS detailJson,
        l.created_at AS createdAt
      FROM booking_activity_logs l
      LEFT JOIN Booking b ON b.id = l.booking_id
      ${whereSql}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `,
    ...whereParams,
    pageSize,
    offset,
  )) as Array<
    BookingActivityLogRow & {
      bookingCode?: string | null;
    }
  >;

  return {
    items: rows.map((row) => ({
      ...normalizeRow(row),
      bookingCode: row.bookingCode ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}
