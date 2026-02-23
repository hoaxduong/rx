import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema/index.ts"

const connectionString =
  (typeof (globalThis as any).Deno !== "undefined"
    ? (globalThis as any).Deno.env.get("DATABASE_URL")
    : process.env.DATABASE_URL) as string

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })

export type Database = typeof db

export * from "./schema/index.ts"

// Re-export drizzle-orm helpers so consumers use the same instance
export { eq, ne, gt, gte, lt, lte, and, or, not, isNull, isNotNull, inArray, notInArray, sql, like, ilike, desc, asc, between, exists, notExists, count, sum, avg, min, max } from "drizzle-orm"
