import { Prisma } from "@prisma/client";

export function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1000", "P1001", "P1002", "P1010"].includes(error.code);
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();

  return (
    lowered.includes("authentication failed against database server") ||
    lowered.includes("can't reach database server") ||
    lowered.includes("environment variable not found: database_url") ||
    lowered.includes("connection error") ||
    lowered.includes("connect") && lowered.includes("database")
  );
}
