import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
dotenv.config();


let dbInstance:any = null;

export function connectDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(connectionString);
  dbInstance = drizzle(sql);

  console.log(" Database connected successfully");
  return dbInstance;
}

// Optional: export default for convenience
export default connectDb();
