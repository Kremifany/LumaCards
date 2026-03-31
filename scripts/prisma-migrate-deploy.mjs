import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnvIfPresent() {
  // Vercel provides env vars; locally we fall back to .env for convenience.
  if (process.env.DATABASE_URL) return;
  try {
    const envPath = resolve(process.cwd(), ".env");
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // ignore missing .env
  }
}

function normalizeDatabaseUrl(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function resolvePgConnectionString(url) {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return url;
  }

  if (url.startsWith("prisma+postgres://")) {
    const parsed = new URL(url);
    const apiKey = parsed.searchParams.get("api_key");
    if (!apiKey) throw new Error("Invalid prisma+postgres URL: missing api_key.");
    const decoded = Buffer.from(apiKey, "base64url").toString("utf8");
    const payload = JSON.parse(decoded);
    if (!payload.databaseUrl) {
      throw new Error("Invalid prisma+postgres URL: missing databaseUrl in api_key.");
    }
    return payload.databaseUrl;
  }

  throw new Error(
    `Unsupported DATABASE_URL format for migrations: "${url.split(":")[0]}:"`
  );
}

loadDotEnvIfPresent();

const raw = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (!raw) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const connectionString = resolvePgConnectionString(raw);

const npxCmd = process.platform === "win32" ? "npx" : "npx";
const result = spawnSync(`${npxCmd} prisma migrate deploy`, {
  shell: true,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: connectionString,
  },
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);

