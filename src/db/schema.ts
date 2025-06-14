import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"

const connectionString = process.env.DATABASE_URL!
const sql = neon(connectionString)
export const db = drizzle(sql)

export * from "./schemas"