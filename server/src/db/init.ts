import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
dotenv.config();

let dbInstance: any = null;

export function connectDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new pg.Pool({
    connectionString: connectionString,
  });

  dbInstance = drizzle(pool);

  console.log("Database connected successfully");
  return dbInstance;
}

// Optional: export default for convenience
export default connectDb();
