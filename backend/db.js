import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Create backend/.env before starting the backend.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase.co")
    ? { rejectUnauthorized: false }
    : undefined
});

export async function query(text, params = []) {
  const started = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - started;
  if (duration > 500) {
    console.log("Slow query", { duration, rows: result.rowCount });
  }
  return result;
}
