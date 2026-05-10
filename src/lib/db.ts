import { PrismaClient } from "@prisma/client";

// In dev, Next.js hot-reloads files which would otherwise spawn a new
// PrismaClient on every reload and exhaust DB connections. Singleton via
// globalThis sidesteps that.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
