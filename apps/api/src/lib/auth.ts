import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@workspace/db"
import { users, sessions, accounts, verifications } from "@workspace/db/schema"
import { env } from "./env.ts"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [env("FRONTEND_URL") || "http://localhost:3000"],
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "user", input: false },
      phone: { type: "string", required: false },
      fullNameVi: { type: "string", required: false, fieldName: "full_name_vi" },
      professionalLicense: { type: "string", required: false, fieldName: "professional_license" },
    },
  },
})
