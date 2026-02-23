import { createMiddleware } from "hono/factory"
import { db } from "@workspace/db"
import { auditLogs } from "@workspace/db/schema"

type AuditEnv = {
  Variables: {
    user: { id: string }
  }
}

export const auditLog = createMiddleware<AuditEnv>(async (c, next) => {
  await next()

  const method = c.req.method
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return

  const user = c.get("user")
  if (!user) return

  const url = new URL(c.req.url)
  const pathParts = url.pathname.split("/").filter(Boolean)
  // e.g., /api/medicines/123 -> resourceType=medicines, resourceId=123
  const resourceType = pathParts[1] || "unknown"
  const resourceId = pathParts[2] || undefined

  try {
    await db.insert(auditLogs).values({
      userId: user.id,
      action: `${method} ${url.pathname}`,
      resourceType,
      resourceId,
      centerId: c.req.header("x-center-id") || undefined,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    })
  } catch {
    // Don't fail the request if audit logging fails
    console.error("Failed to write audit log")
  }
})
