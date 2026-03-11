import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type NewsletterSubscriber = {
  id: string;
  email: string;
  createdAt: string;
};

const DEMO_DIR = path.join(process.cwd(), ".data");
const DEMO_FILE = path.join(DEMO_DIR, "newsletter-subscribers.json");

async function readSubscribers() {
  try {
    const content = await fs.readFile(DEMO_FILE, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as NewsletterSubscriber[];
  } catch {
    return [];
  }
}

async function writeSubscribers(subscribers: NewsletterSubscriber[]) {
  await fs.mkdir(DEMO_DIR, { recursive: true });
  await fs.writeFile(DEMO_FILE, JSON.stringify(subscribers, null, 2), "utf8");
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

  const nextSubscribers = [subscriber, ...subscribers].slice(0, 1000);
  await writeSubscribers(nextSubscribers);

  return { status: "CREATED" as const, subscriber };
}
