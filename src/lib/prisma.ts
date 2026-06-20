import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || process.env.NODE_ENV !== "production") return undefined;
  // Limit to 1 connection per serverless instance to avoid exhausting Neon's pool
  if (url.includes("connection_limit")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=1&pool_timeout=10`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error"],
    datasources: { db: { url: buildDatasourceUrl() ?? process.env.DATABASE_URL } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
