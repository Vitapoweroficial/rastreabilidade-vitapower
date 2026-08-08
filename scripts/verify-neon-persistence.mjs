import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const isVercelBuild = process.env.VERCEL === "1";
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!isVercelBuild) {
  console.log("Skipping Neon persistence verification outside Vercel.");
  process.exit(0);
}

if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required in the Vercel environment.");
}

const marker = `vp-${process.env.VERCEL_GIT_COMMIT_SHA ?? "build"}-${randomUUID()}`;
const writer = neon(connectionString);
const reader = neon(connectionString);
const cleaner = neon(connectionString);

await writer.query(`
  CREATE TABLE IF NOT EXISTS deployment_health_checks (
    marker TEXT PRIMARY KEY,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

await writer.query(
  "INSERT INTO deployment_health_checks (marker) VALUES ($1)",
  [marker]
);

const persistedRows = await reader.query(
  "SELECT marker FROM deployment_health_checks WHERE marker = $1",
  [marker]
);

if (persistedRows.length !== 1 || persistedRows[0]?.marker !== marker) {
  throw new Error("Neon persistence verification failed: inserted marker was not readable from a separate connection.");
}

await cleaner.query(
  "DELETE FROM deployment_health_checks WHERE marker = $1",
  [marker]
);

const remainingRows = await reader.query(
  "SELECT marker FROM deployment_health_checks WHERE marker = $1",
  [marker]
);

if (remainingRows.length !== 0) {
  throw new Error("Neon persistence verification failed: cleanup did not persist.");
}

console.log("Neon persistence verification passed across independent connections.");
