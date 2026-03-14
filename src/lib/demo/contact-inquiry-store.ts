import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type InquiryStatusValue = "PENDING" | "RESOLVED";

export type ContactInquiryRecord = {
  id: string;
  referenceCode: string;
  fullName: string;
  phone: string;
  email: string;
  tourId?: string;
  departureDate?: string;
  numberOfGuests: number;
  message: string;
  status: InquiryStatusValue;
  createdAt: string;
  updatedAt: string;
};

type ContactInquiryPayload = {
  fullName: string;
  phone: string;
  email: string;
  tourId?: string;
  departureDate?: string;
  numberOfGuests: number;
  message: string;
};

type ContactInquiryListFilter = {
  search?: string;
  status?: InquiryStatusValue;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  pageSize?: number;
};

const DEMO_DIR = path.join(process.cwd(), ".data");
const DEMO_FILE = path.join(DEMO_DIR, "contact-inquiries.json");

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function normalizeInquiry(value: Partial<ContactInquiryRecord>): ContactInquiryRecord | null {
  if (!value || !value.id || !value.referenceCode || !value.fullName || !value.phone || !value.email) {
    return null;
  }

  const createdAt = parseDate(value.createdAt) ?? new Date();
  const updatedAt = parseDate(value.updatedAt) ?? createdAt;

  return {
    id: value.id,
    referenceCode: value.referenceCode,
    fullName: value.fullName,
    phone: value.phone,
    email: value.email,
    tourId: value.tourId,
    departureDate: value.departureDate,
    numberOfGuests: Math.max(1, Math.trunc(value.numberOfGuests ?? 1)),
    message: value.message?.trim() ?? "",
    status: value.status === "RESOLVED" ? "RESOLVED" : "PENDING",
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

async function readInquiries() {
  try {
    const content = await fs.readFile(DEMO_FILE, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as ContactInquiryRecord[];
    }

    return parsed
      .map((item) => normalizeInquiry(item as Partial<ContactInquiryRecord>))
      .filter((item): item is ContactInquiryRecord => Boolean(item));
  } catch {
    return [] as ContactInquiryRecord[];
  }
}

async function writeInquiries(records: ContactInquiryRecord[]) {
  await fs.mkdir(DEMO_DIR, { recursive: true });
  await fs.writeFile(DEMO_FILE, JSON.stringify(records, null, 2), "utf8");
}

function buildReferenceCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TV${yy}${mm}${dd}${random}`;
}

function applyInquiryFilters(records: ContactInquiryRecord[], filter: ContactInquiryListFilter = {}) {
  const search = filter.search?.trim().toLowerCase() ?? "";
  const from = filter.createdFrom ? startOfDay(filter.createdFrom) : undefined;
  const to = filter.createdTo ? endOfDay(filter.createdTo) : undefined;

  return records
    .filter((record) => {
      if (filter.status && record.status !== filter.status) {
        return false;
      }

      if (search) {
        const searchableText = [
          record.referenceCode,
          record.fullName,
          record.phone,
          record.email,
          record.message,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchableText.includes(search)) {
          return false;
        }
      }

      const createdAt = parseDate(record.createdAt);
      if (!createdAt) {
        return true;
      }

      if (from && createdAt < from) {
        return false;
      }
      if (to && createdAt > to) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aTime = parseDate(a.createdAt)?.getTime() ?? 0;
      const bTime = parseDate(b.createdAt)?.getTime() ?? 0;
      return bTime - aTime;
    });
}

export async function saveContactInquiry(payload: ContactInquiryPayload) {
  const records = await readInquiries();
  const now = new Date().toISOString();
  const record: ContactInquiryRecord = {
    id: randomUUID(),
    referenceCode: buildReferenceCode(),
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email,
    tourId: payload.tourId,
    departureDate: payload.departureDate,
    numberOfGuests: payload.numberOfGuests,
    message: payload.message,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  const nextRecords = [record, ...records].slice(0, 2000);
  await writeInquiries(nextRecords);

  return record;
}

export async function demoGetContactInquiries(filter: ContactInquiryListFilter = {}) {
  const allRecords = await readInquiries();
  const rows = applyInquiryFilters(allRecords, filter);

  const page = Math.max(filter.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filter.pageSize ?? 15, 1), 50);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: rows.slice(startIndex, startIndex + pageSize),
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function demoExportContactInquiries(filter: ContactInquiryListFilter = {}) {
  const allRecords = await readInquiries();
  return applyInquiryFilters(allRecords, filter).slice(0, 5000);
}

export async function demoUpdateContactInquiryStatus(
  inquiryId: string,
  status: InquiryStatusValue,
) {
  const records = await readInquiries();
  const targetIndex = records.findIndex((record) => record.id === inquiryId);
  if (targetIndex < 0) return null;

  const target = records[targetIndex]!;
  const updated: ContactInquiryRecord = {
    ...target,
    status,
    updatedAt: new Date().toISOString(),
  };

  const nextRecords = [...records];
  nextRecords[targetIndex] = updated;
  await writeInquiries(nextRecords);

  return updated;
}
