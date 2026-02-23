import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { users, centerMembers } from "@workspace/db/schema"
import { eq, and } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"
import { requireRole } from "../middleware/rbac.ts"

const inviteSchema = z.object({
  userId: z.string().uuid(),
  centerId: z.string().uuid(),
  role: z.enum(["admin", "center_manager", "pharmacist", "doctor", "nurse"]),
  canAccessChildren: z.boolean().optional(),
})

const updateRoleSchema = z.object({
  role: z.enum(["admin", "center_manager", "pharmacist", "doctor", "nurse"]),
  canAccessChildren: z.boolean().optional(),
})

export const usersRoute = new Hono()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const centerId = c.req.query("centerId")
    if (!centerId) {
      const allUsers = await db.query.users.findMany({
        columns: { id: true, name: true, email: true, phone: true, fullNameVi: true },
      })
      return c.json(allUsers)
    }

    const members = await db.query.centerMembers.findMany({
      where: and(eq(centerMembers.centerId, centerId), eq(centerMembers.isActive, true)),
      with: {
        user: {
          columns: { id: true, name: true, email: true, phone: true, fullNameVi: true, professionalLicense: true },
        },
      },
    })
    return c.json(members)
  })
  .post(
    "/invite",
    requireRole("admin", "center_manager"),
    zValidator("json", inviteSchema),
    async (c) => {
      const data = c.req.valid("json")
      const [member] = await db
        .insert(centerMembers)
        .values({
          userId: data.userId,
          centerId: data.centerId,
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
    "/members/:id/role",
    requireRole("admin", "center_manager"),
    zValidator("json", updateRoleSchema),
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
  .delete(
    "/members/:id",
    requireRole("admin", "center_manager"),
    async (c) => {
      const { id } = c.req.param()
      const [member] = await db
        .update(centerMembers)
        .set({ isActive: false })
        .where(eq(centerMembers.id, id))
        .returning()
      if (!member) return c.json({ error: "Member not found" }, 404)
      return c.json({ success: true })
    }
  )
