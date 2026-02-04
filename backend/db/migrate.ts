import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pool, db } from "../db/index.js";

async function main() {
  await migrate(db, { migrationsFolder: "./backend/db/migrations" });
  await pool.end();
  console.log("Migrations completed");
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});