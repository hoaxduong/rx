/**
 * Creates a super admin user.
 *
 * Usage:
 *   pnpm --filter api create-super-admin
 *
 * Environment variables:
 *   DATABASE_URL          – required
 *   SUPER_ADMIN_EMAIL     – default: admin@rx.local
 *   SUPER_ADMIN_PASSWORD  – default: Admin@123
 *   SUPER_ADMIN_NAME      – default: Super Admin
 */
import { db } from "@workspace/db"
import { users, accounts } from "@workspace/db/schema"
import { eq } from "@workspace/db"
import { hashPassword } from "better-auth/crypto"

const email = process.env.SUPER_ADMIN_EMAIL || "admin@rx.local"
const password = process.env.SUPER_ADMIN_PASSWORD || "Admin@123"
const name = process.env.SUPER_ADMIN_NAME || "Super Admin"

async function main() {
  console.log(`Creating super admin: ${email}`)

  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (existing) {
    await db.update(users).set({ role: "super_admin" }).where(eq(users.id, existing.id))
    console.log(`User already exists. Updated role to super_admin. (id: ${existing.id})`)
    process.exit(0)
  }

  // Create user
  const result = await db
    .insert(users)
    .values({
      name,
      email,
      emailVerified: true,
      role: "super_admin",
    })
    .returning()
  const user = result[0]!

  // Create credential account with hashed password
  const hashed = await hashPassword(password)
  await db.insert(accounts).values({
    userId: user.id,
    accountId: user.id,
    providerId: "credential",
    password: hashed,
  })

  console.log(`Super admin created successfully.`)
  console.log(`  ID:    ${user.id}`)
  console.log(`  Email: ${email}`)
  console.log(`  Pass:  ${password}`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Failed to create super admin:", err)
  process.exit(1)
})
