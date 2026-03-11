import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

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
  createdAt: string;
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

const DEMO_DIR = path.join(process.cwd(), ".data");
const DEMO_FILE = path.join(DEMO_DIR, "contact-inquiries.json");

async function readInquiries() {
  try {
    const content = await fs.readFile(DEMO_FILE, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as ContactInquiryRecord[];
  } catch {
    return [];
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

export async function saveContactInquiry(payload: ContactInquiryPayload) {
  const records = await readInquiries();
  const createdAt = new Date().toISOString();
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
    createdAt,
  };

  const nextRecords = [record, ...records].slice(0, 500);
  await writeInquiries(nextRecords);

  return record;
}
