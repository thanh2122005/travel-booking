import { Prisma } from "@prisma/client";

export function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    // Lỗi init Prisma (sai env, không kết nối được DB...).
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Nhóm lỗi kết nối/xác thực DB của Prisma.
    return ["P1000", "P1001", "P1002", "P1010"].includes(error.code);
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();

  return (
    lowered.includes("authentication failed against database server") ||
    lowered.includes("can't reach database server") ||
    lowered.includes("environment variable not found: database_url") ||
    lowered.includes("connection error") ||
    (lowered.includes("connect") && lowered.includes("database"))
  );
}

export function isPrismaNotFoundError(error: unknown) {
  // P2025: bản ghi không tồn tại khi update/delete/findUniqueOrThrow.
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export function isPrismaUniqueConstraintError(error: unknown) {
  // P2002: vi phạm unique key.
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
export function isPrismaForeignKeyError(error: unknown) {
  // P2003: vi phạm khóa ngoại.
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}
