import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { alerts } from "@workspace/db/schema"
import { eq, and, sql, desc, inArray } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"
import { centerScope } from "../middleware/center-scope.ts"

export const alertsRoute = new Hono()
  .use("*", requireAuth)
  .use("*", centerScope)
  .get("/", async (c) => {
    const { centerId, type, status = "active" } = c.req.query()
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const targetCenterIds = centerId ? [centerId] : authorizedCenterIds

    const conditions = [
      inArray(alerts.centerId, targetCenterIds),
    ]
    if (status) conditions.push(eq(alerts.status, status as any))
    if (type) conditions.push(eq(alerts.type, type as any))

    const result = await db.query.alerts.findMany({
      where: and(...conditions),
      with: { medicine: true, center: true, inventoryBatch: true },
      orderBy: [desc(alerts.createdAt)],
    })
    return c.json(result)
  })
  .patch(
    "/:id/acknowledge",
    zValidator("json", z.object({}).optional()),
    async (c) => {
      const { id } = c.req.param()
      const user = c.get("user")
      const [alert] = await db
        .update(alerts)
        .set({
          status: "acknowledged",
          acknowledgedBy: user.id,
          acknowledgedAt: new Date(),
        })
        .where(eq(alerts.id, id))
        .returning()
      if (!alert) return c.json({ error: "Alert not found" }, 404)
      return c.json(alert)
    }
  )
  .patch("/:id/dismiss", async (c) => {
    const { id } = c.req.param()
    const [alert] = await db
      .update(alerts)
      .set({ status: "dismissed" })
      .where(eq(alerts.id, id))
      .returning()
    if (!alert) return c.json({ error: "Alert not found" }, 404)
    return c.json(alert)
  })
  .patch("/:id/resolve", async (c) => {
    const { id } = c.req.param()
    const [alert] = await db
      .update(alerts)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(alerts.id, id))
      .returning()
    if (!alert) return c.json({ error: "Alert not found" }, 404)
    return c.json(alert)
  })
