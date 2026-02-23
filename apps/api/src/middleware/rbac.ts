import { createMiddleware } from "hono/factory"
import { db } from "@workspace/db"
import { centerMembers } from "@workspace/db/schema"
import { eq, and, inArray } from "@workspace/db"

type RbacEnv = {
  Variables: {
    user: { id: string }
    memberRole: string
    centerId: string
  }
}

export function requireRole(...roles: string[]) {
  return createMiddleware<RbacEnv>(async (c, next) => {
    const user = c.get("user")
    const centerId = c.req.header("x-center-id") || c.req.query("centerId")

    if (!centerId) {
      return c.json({ error: "Center ID required" }, 400)
    }

    const membership = await db.query.centerMembers.findFirst({
      where: and(
        eq(centerMembers.userId, user.id),
        eq(centerMembers.centerId, centerId),
        eq(centerMembers.isActive, true)
      ),
    })

    if (!membership) {
      return c.json({ error: "Not a member of this center" }, 403)
    }

    if (roles.length > 0 && !roles.includes(membership.role)) {
      return c.json({ error: "Insufficient permissions" }, 403)
    }

    c.set("memberRole", membership.role)
    c.set("centerId", centerId)
    await next()
  })
}
