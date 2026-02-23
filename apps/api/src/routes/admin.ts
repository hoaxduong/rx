import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { users, centers, centerMembers } from "@workspace/db/schema"
import { eq, like, ilike, sql, count } from "@workspace/db"
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

  .put("/users/:id", zValidator("json", updateUserSchema), async (c) => {
    const { id } = c.req.param()
    const data = c.req.valid("json")
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
