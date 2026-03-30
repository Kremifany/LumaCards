import prismaPackage from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Vercel's TypeScript resolver may type `@prisma/client` as `@prisma/client/default`
// which doesn't expose `PrismaClient` as a typed export. Use a safe cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PrismaClient = (prismaPackage as any).PrismaClient as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientInstance = any;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientInstance;
  prismaPool?: Pool;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

function resolvePgConnectionString(url: string) {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return url;
  }

  if (url.startsWith("prisma+postgres://")) {
    const parsed = new URL(url);
    const apiKey = parsed.searchParams.get("api_key");
    if (!apiKey) {
      throw new Error("Invalid prisma+postgres URL: missing api_key.");
    }

    const decoded = Buffer.from(apiKey, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as { databaseUrl?: string };
    if (!payload.databaseUrl) {
      throw new Error("Invalid prisma+postgres URL: missing databaseUrl in api_key.");
    }
    return payload.databaseUrl;
  }

  throw new Error("Unsupported DATABASE_URL format.");
}

const pgConnectionString = resolvePgConnectionString(connectionString);

const pool =
  globalForPrisma.prismaPool ??
  new Pool({
    connectionString: pgConnectionString,
    max: 1,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
}
