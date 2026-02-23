import { createMiddleware } from "hono/factory"
import { db } from "@workspace/db"
import { centerMembers, centers } from "@workspace/db/schema"
import { eq, and, or, inArray } from "@workspace/db"

type CenterScopeEnv = {
  Variables: {
    user: { id: string }
    authorizedCenterIds: string[]
  }
}

export const centerScope = createMiddleware<CenterScopeEnv>(async (c, next) => {
  const user = c.get("user")

  const memberships = await db.query.centerMembers.findMany({
    where: and(
      eq(centerMembers.userId, user.id),
      eq(centerMembers.isActive, true)
    ),
    with: { center: true },
  })

  const authorizedCenterIds: string[] = []

  for (const m of memberships) {
    authorizedCenterIds.push(m.centerId)

    if (m.canAccessChildren) {
      const children = await db.query.centers.findMany({
        where: eq(centers.parentId, m.centerId),
      })
      for (const child of children) {
        authorizedCenterIds.push(child.id)
      }
    }
  }

  c.set("authorizedCenterIds", [...new Set(authorizedCenterIds)])
  await next()
})
