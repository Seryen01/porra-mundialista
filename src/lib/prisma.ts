import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  // During `next build` there is no real DB — return a dummy URL so PrismaClient
  // instantiates without throwing "Environment variable not found: DATABASE_URL".
  // Queries made at build time will fail gracefully (caught in each route).
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return url ?? "postgresql://build:build@localhost:5432/build";
  }
  if (!url || process.env.NODE_ENV !== "production") return undefined;
  // Limit to 1 connection per serverless instance to avoid exhausting Neon's pool
  if (url.includes("connection_limit")) return url;
  // connect_timeout=20: gives Neon time to wake but stays under Railway's 30s request timeout
  // so Prisma fails cleanly (caught try-catch → 500) instead of Railway killing the request (502)
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=1&pool_timeout=10&connect_timeout=20`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error"],
    datasources: { db: { url: buildDatasourceUrl() ?? process.env.DATABASE_URL } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
