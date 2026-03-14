import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type NewsletterSubscriber = {
  id: string;
  email: string;
  createdAt: string;
};

type NewsletterListFilter = {
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  pageSize?: number;
};

const DEMO_DIR = path.join(process.cwd(), ".data");
const DEMO_FILE = path.join(DEMO_DIR, "newsletter-subscribers.json");

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

function normalizeSubscriber(value: Partial<NewsletterSubscriber>): NewsletterSubscriber | null {
  if (!value || !value.id || !value.email) {
    return null;
  }

  const createdAt = parseDate(value.createdAt) ?? new Date();
  return {
    id: value.id,
    email: value.email.trim().toLowerCase(),
    createdAt: createdAt.toISOString(),
  };
}

async function readSubscribers() {
  try {
    const content = await fs.readFile(DEMO_FILE, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as NewsletterSubscriber[];
    }

    return parsed
      .map((item) => normalizeSubscriber(item as Partial<NewsletterSubscriber>))
      .filter((item): item is NewsletterSubscriber => Boolean(item));
  } catch {
    return [] as NewsletterSubscriber[];
  }
}

async function writeSubscribers(subscribers: NewsletterSubscriber[]) {
  await fs.mkdir(DEMO_DIR, { recursive: true });
  await fs.writeFile(DEMO_FILE, JSON.stringify(subscribers, null, 2), "utf8");
}

function applySubscriberFilters(subscribers: NewsletterSubscriber[], filter: NewsletterListFilter = {}) {
  const search = filter.search?.trim().toLowerCase() ?? "";
  const from = filter.createdFrom ? startOfDay(filter.createdFrom) : undefined;
  const to = filter.createdTo ? endOfDay(filter.createdTo) : undefined;

  return subscribers
    .filter((subscriber) => {
      if (search && !subscriber.email.toLowerCase().includes(search)) {
        return false;
      }

      const createdAt = parseDate(subscriber.createdAt);
      if (!createdAt) return true;

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

export async function saveNewsletterSubscriber(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const subscribers = await readSubscribers();
  const existed = subscribers.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (existed) {
    return { status: "EXISTED" as const, subscriber: existed };
  }

  const subscriber: NewsletterSubscriber = {
    id: randomUUID(),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };

  const nextSubscribers = [subscriber, ...subscribers].slice(0, 5000);
  await writeSubscribers(nextSubscribers);

  return { status: "CREATED" as const, subscriber };
}

export async function demoGetNewsletterSubscribers(filter: NewsletterListFilter = {}) {
  const allSubscribers = await readSubscribers();
  const rows = applySubscriberFilters(allSubscribers, filter);

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

export async function demoExportNewsletterSubscribers(filter: NewsletterListFilter = {}) {
  const allSubscribers = await readSubscribers();
  return applySubscriberFilters(allSubscribers, filter).slice(0, 5000);
}
