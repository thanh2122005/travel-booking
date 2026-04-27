import { randomUUID } from "crypto";
import { db } from "@/lib/db/prisma";

type QueryExecutor = Pick<typeof db, "$queryRawUnsafe" | "$executeRawUnsafe">;

export type AdminActivityLogAction =
  | "ADMIN_LOGIN"
  | "REVIEW_VISIBILITY_UPDATED"
  | "REVIEW_CONTENT_UPDATED"
  | "REVIEWS_BULK_UPDATED"
  | "USER_UPDATED"
  | "USER_CONTENT_UPDATED"
  | "USERS_BULK_UPDATED"
  | "USER_DELETED"
  | "NEWSLETTER_BULK_DELETED"
  | "INQUIRY_STATUS_UPDATED"
  | "INQUIRIES_BULK_UPDATED";

type AdminActivityLogRow = {
  id: string;
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  bookingCode?: string | null;
  detailJson?: string | null;
  createdAt?: Date | string | null;
};

export async function ensureAdminActivityLogTable(executor: QueryExecutor = db) {
  await executor.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id VARCHAR(191) PRIMARY KEY,
      action VARCHAR(80) NOT NULL,
      actor_id VARCHAR(191) NULL,
      actor_name VARCHAR(191) NULL,
      booking_code VARCHAR(191) NULL,
      detail_json LONGTEXT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_admin_activity_logs_action_created (action, created_at),
      INDEX idx_admin_activity_logs_booking_created (booking_code, created_at)
    )
  `);
}

function normalizeDate(value?: Date | string | null) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function appendAdminActivityLog(
  input: {
    action: AdminActivityLogAction;
    actorId?: string | null;
    actorName?: string | null;
    bookingCode?: string | null;
    detail?: Record<string, unknown> | null;
  },
  executor: QueryExecutor = db,
) {
  await ensureAdminActivityLogTable(executor);
  const detailJson =
    input.detail === undefined || input.detail === null ? null : JSON.stringify(input.detail);

  await executor.$executeRawUnsafe(
    `
      INSERT INTO admin_activity_logs (
        id,
        action,
        actor_id,
        actor_name,
        booking_code,
        detail_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    randomUUID(),
    input.action,
    input.actorId ?? null,
    input.actorName ?? null,
    input.bookingCode ?? null,
    detailJson,
  );
}

export async function getUnifiedAdminActivityLogs(input: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  await ensureAdminActivityLogTable(db);
  const page = Math.max(input.page ?? 1, 1);
  const pageSize = Math.min(Math.max(input.pageSize ?? 30, 1), 200);
  const search = input.search?.trim() ?? "";
  const pattern = `%${search}%`;
  const hasSearch = Boolean(search);

  const whereSql = hasSearch
    ? `
      WHERE (
        COALESCE(bookingCode, '') LIKE ?
        OR action LIKE ?
        OR COALESCE(actorName, '') LIKE ?
        OR COALESCE(detailJson, '') LIKE ?
      )
    `
    : "";
  const whereParams = hasSearch ? [pattern, pattern, pattern, pattern] : [];

  const countRows = (await db.$queryRawUnsafe(
    `
      SELECT COUNT(*) AS total
      FROM (
        SELECT
          b.bookingCode AS bookingCode,
          l.action AS action,
          l.actor_name AS actorName,
          l.detail_json AS detailJson
        FROM booking_activity_logs l
        LEFT JOIN Booking b ON b.id = l.booking_id
        UNION ALL
        SELECT
          al.booking_code AS bookingCode,
          al.action AS action,
          al.actor_name AS actorName,
          al.detail_json AS detailJson
        FROM admin_activity_logs al
      ) feed
      ${whereSql}
    `,
    ...whereParams,
  )) as Array<{ total: number | bigint }>;
  const total = Number(countRows[0]?.total ?? 0);
  const offset = (page - 1) * pageSize;

  const rows = (await db.$queryRawUnsafe(
    `
      SELECT *
      FROM (
        SELECT
          l.id AS id,
          l.action AS action,
          l.actor_id AS actorId,
          l.actor_name AS actorName,
          b.bookingCode AS bookingCode,
          l.detail_json AS detailJson,
          l.created_at AS createdAt
        FROM booking_activity_logs l
        LEFT JOIN Booking b ON b.id = l.booking_id
        UNION ALL
        SELECT
          al.id AS id,
          al.action AS action,
          al.actor_id AS actorId,
          al.actor_name AS actorName,
          al.booking_code AS bookingCode,
          al.detail_json AS detailJson,
          al.created_at AS createdAt
        FROM admin_activity_logs al
      ) feed
      ${whereSql}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `,
    ...whereParams,
    pageSize,
    offset,
  )) as AdminActivityLogRow[];

  return {
    items: rows.map((row) => ({
      id: row.id,
      action: row.action,
      actorId: row.actorId ?? null,
      actorName: row.actorName ?? null,
      bookingCode: row.bookingCode ?? null,
      detailJson: row.detailJson ?? null,
      createdAt: normalizeDate(row.createdAt),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}
