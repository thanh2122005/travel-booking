import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Singleton Prisma client để tránh mở nhiều connection khi dev hot-reload.
export const db = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  // Chỉ cache trên global ở môi trường dev.
  global.prisma = db;
}

