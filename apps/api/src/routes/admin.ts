import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { users, accounts, centers, centerMembers } from "@workspace/db/schema"
import { eq, and, like, ilike, sql, count } from "@workspace/db"
import { hashPassword } from "better-auth/crypto"
import { requireAuth } from "../middleware/auth.ts"
import { requireSuperAdmin } from "../middleware/super-admin.ts"

const createCenterSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(["commune", "satellite"]),
  parentId: z.string().uuid().optional(),
  address: z.string().optional(),
  wardCode: z.string().optional(),
  districtCode: z.string().optional(),
  provinceCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  licenseNumber: z.string().optional(),
})

const updateCenterSchema = createCenterSchema.partial()

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["user", "super_admin"]).optional(),
  phone: z.string().optional(),
  fullNameVi: z.string().optional(),
})

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["user", "super_admin"]).default("user"),
  phone: z.string().optional(),
  fullNameVi: z.string().optional(),
})

export const adminRoute = new Hono()
  .use("*", requireAuth)
  .use("*", requireSuperAdmin)

  // ── Centers (tenants) ──────────────────────────────────────────────
  .get("/centers", async (c) => {
    const search = c.req.query("search")
    const page = Number(c.req.query("page") || "1")
    const limit = Number(c.req.query("limit") || "50")
    const offset = (page - 1) * limit

    const where = search ? ilike(centers.name, `%${search}%`) : undefined

    const [items, countResult] = await Promise.all([
      db.query.centers.findMany({
        where,
        with: { parent: true, children: true },
        limit,
        offset,
        orderBy: (centers, { asc }) => [asc(centers.name)],
      }),
      db.select({ total: count() }).from(centers).where(where),
    ])
    const total = countResult[0]?.total ?? 0

    return c.json({ items, total, page, limit })
  })

  .post("/centers", zValidator("json", createCenterSchema), async (c) => {
    const data = c.req.valid("json")
    const [center] = await db.insert(centers).values(data).returning()
    return c.json(center, 201)
  })

  .put("/centers/:id", zValidator("json", updateCenterSchema), async (c) => {
    const { id } = c.req.param()
    const data = c.req.valid("json")
    const [center] = await db
      .update(centers)
      .set(data)
      .where(eq(centers.id, id))
      .returning()
    if (!center) return c.json({ error: "Center not found" }, 404)
    return c.json(center)
  })

  .delete("/centers/:id", async (c) => {
    const { id } = c.req.param()
    const [center] = await db
      .update(centers)
      .set({ isActive: false })
      .where(eq(centers.id, id))
      .returning()
    if (!center) return c.json({ error: "Center not found" }, 404)
    return c.json({ success: true })
  })

  // ── Center Members ────────────────────────────────────────────────
  .get("/centers/:id/members", async (c) => {
    const { id } = c.req.param()
    const members = await db.query.centerMembers.findMany({
      where: and(eq(centerMembers.centerId, id), eq(centerMembers.isActive, true)),
      with: {
        user: {
          columns: { id: true, name: true, email: true, phone: true, fullNameVi: true },
        },
      },
      orderBy: (cm, { asc }) => [asc(cm.createdAt)],
    })
    return c.json(members)
  })

  .post(
    "/centers/:id/members",
    zValidator(
      "json",
      z.object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "center_manager", "pharmacist", "doctor", "nurse"]),
        canAccessChildren: z.boolean().optional(),
      })
    ),
    async (c) => {
      const centerId = c.req.param("id")
      const data = c.req.valid("json")
      const [member] = await db
        .insert(centerMembers)
        .values({
          userId: data.userId,
          centerId,
          role: data.role,
          canAccessChildren: data.canAccessChildren ?? false,
        })
        .onConflictDoUpdate({
          target: [centerMembers.userId, centerMembers.centerId],
          set: {
            role: data.role,
            canAccessChildren: data.canAccessChildren ?? false,
            isActive: true,
          },
        })
        .returning()
      return c.json(member, 201)
    }
  )

  .put(
    "/centers/:centerId/members/:id",
    zValidator(
      "json",
      z.object({
        role: z.enum(["admin", "center_manager", "pharmacist", "doctor", "nurse"]).optional(),
        canAccessChildren: z.boolean().optional(),
      })
    ),
    async (c) => {
      const { id } = c.req.param()
      const data = c.req.valid("json")
      const [member] = await db
        .update(centerMembers)
        .set(data)
        .where(eq(centerMembers.id, id))
        .returning()
      if (!member) return c.json({ error: "Member not found" }, 404)
      return c.json(member)
    }
  )

  .delete("/centers/:centerId/members/:id", async (c) => {
    const { id } = c.req.param()
    const [member] = await db
      .update(centerMembers)
      .set({ isActive: false })
      .where(eq(centerMembers.id, id))
      .returning()
    if (!member) return c.json({ error: "Member not found" }, 404)
    return c.json({ success: true })
  })

  // ── Users ──────────────────────────────────────────────────────────
  .get("/users", async (c) => {
    const search = c.req.query("search")
    const page = Number(c.req.query("page") || "1")
    const limit = Number(c.req.query("limit") || "50")
    const offset = (page - 1) * limit

    const where = search
      ? sql`(${ilike(users.name, `%${search}%`)} OR ${ilike(users.email, `%${search}%`)})`
      : undefined

    const [items, userCountResult] = await Promise.all([
      db.query.users.findMany({
        where,
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          fullNameVi: true,
          createdAt: true,
        },
        limit,
        offset,
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      }),
      db.select({ total: count() }).from(users).where(where),
    ])
    const total = userCountResult[0]?.total ?? 0

    return c.json({ items, total, page, limit })
  })

  .get("/users/:id", async (c) => {
    const { id } = c.req.param()
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        fullNameVi: true,
        professionalLicense: true,
        createdAt: true,
      },
    })
    if (!user) return c.json({ error: "User not found" }, 404)

    const memberships = await db.query.centerMembers.findMany({
      where: eq(centerMembers.userId, id),
      with: { center: { columns: { id: true, name: true, code: true, type: true } } },
    })

    return c.json({ ...user, memberships })
  })

  .post("/users", zValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json")

    // Check for duplicate email
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })
    if (existing) {
      return c.json({ error: "Email already exists" }, 409)
    }

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        emailVerified: true,
        role: data.role,
        phone: data.phone,
        fullNameVi: data.fullNameVi,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        fullNameVi: users.fullNameVi,
        createdAt: users.createdAt,
      })

    // Create credential account with hashed password
    const hashed = await hashPassword(data.password)
    await db.insert(accounts).values({
      userId: newUser!.id,
      accountId: newUser!.id,
      providerId: "credential",
      password: hashed,
    })

    return c.json(newUser, 201)
  })

  .put("/users/:id", zValidator("json", updateUserSchema), async (c) => {
    const { id } = c.req.param()
    const data = c.req.valid("json")
    const currentUser = c.get("user")

    if (id === currentUser.id && data.role !== undefined) {
      return c.json({ error: "Cannot change your own role" }, 400)
    }

    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        fullNameVi: users.fullNameVi,
      })
    if (!user) return c.json({ error: "User not found" }, 404)
    return c.json(user)
  })

  .delete("/users/:id", async (c) => {
    const { id } = c.req.param()
    const user = c.get("user")
    if (id === user.id) {
      return c.json({ error: "Cannot delete yourself" }, 400)
    }
    await db.delete(users).where(eq(users.id, id))
    return c.json({ success: true })
  })
