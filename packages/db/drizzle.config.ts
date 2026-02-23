import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/schema",
  out: "../../supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    prefix: "supabase",
  },
})
