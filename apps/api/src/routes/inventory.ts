import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { inventoryBatches, stockThresholds, medicines } from "@workspace/db/schema"
import { eq, and, lte, gte, sql, asc, gt } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"
import { requireRole } from "../middleware/rbac.ts"
import { centerScope } from "../middleware/center-scope.ts"

const thresholdSchema = z.object({
  centerId: z.string().uuid(),
  medicineId: z.string().uuid(),
  minimumQuantity: z.number().int().min(0),
  maximumQuantity: z.number().int().optional(),
  reorderQuantity: z.number().int().optional(),
  expiryWarningDays: z.number().int().min(1).default(90),
})

export const inventoryRoute = new Hono()
  .use("*", requireAuth)
  .use("*", centerScope)
  // Stock list by center
  .get("/", async (c) => {
    const centerId = c.req.query("centerId")
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const targetCenterIds = centerId ? [centerId] : authorizedCenterIds

    // Aggregate stock by medicine per center
    const stock = await db
      .select({
        centerId: inventoryBatches.centerId,
        medicineId: inventoryBatches.medicineId,
        totalQuantity: sql<number>`sum(${inventoryBatches.quantity})`.as("total_quantity"),
        totalValue: sql<number>`sum(${inventoryBatches.quantity} * COALESCE(${inventoryBatches.unitPrice}::numeric, 0))`.as("total_value"),
        batchCount: sql<number>`count(*)`.as("batch_count"),
        earliestExpiry: sql<string>`min(${inventoryBatches.expiryDate})`.as("earliest_expiry"),
      })
      .from(inventoryBatches)
      .where(
        and(
          sql`${inventoryBatches.centerId} = ANY(${targetCenterIds})`,
          gt(inventoryBatches.quantity, 0)
        )
      )
      .groupBy(inventoryBatches.centerId, inventoryBatches.medicineId)

    return c.json(stock)
  })
  // Expiring batches
  .get("/expiring", async (c) => {
    const days = Number(c.req.query("days") || "90")
    const centerId = c.req.query("centerId")
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const targetCenterIds = centerId ? [centerId] : authorizedCenterIds

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const expiring = await db.query.inventoryBatches.findMany({
      where: and(
        sql`${inventoryBatches.centerId} = ANY(${targetCenterIds})`,
        lte(inventoryBatches.expiryDate, futureDate.toISOString().split("T")[0]!),
        gt(inventoryBatches.quantity, 0)
      ),
      with: { medicine: true, center: true },
      orderBy: [asc(inventoryBatches.expiryDate)],
    })

    return c.json(expiring)
  })
  // Low stock items
  .get("/low-stock", async (c) => {
    const centerId = c.req.query("centerId")
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const targetCenterIds = centerId ? [centerId] : authorizedCenterIds

    const lowStock = await db
      .select({
        centerId: stockThresholds.centerId,
        medicineId: stockThresholds.medicineId,
        minimumQuantity: stockThresholds.minimumQuantity,
        currentQuantity: sql<number>`COALESCE(sum(${inventoryBatches.quantity}), 0)`.as("current_quantity"),
      })
      .from(stockThresholds)
      .leftJoin(
        inventoryBatches,
        and(
          eq(stockThresholds.centerId, inventoryBatches.centerId),
          eq(stockThresholds.medicineId, inventoryBatches.medicineId)
        )
      )
      .where(sql`${stockThresholds.centerId} = ANY(${targetCenterIds})`)
      .groupBy(stockThresholds.id)
      .having(sql`COALESCE(sum(${inventoryBatches.quantity}), 0) < ${stockThresholds.minimumQuantity}`)

    return c.json(lowStock)
  })
  // Batch detail
  .get("/batches/:id", async (c) => {
    const { id } = c.req.param()
    const batch = await db.query.inventoryBatches.findFirst({
      where: eq(inventoryBatches.id, id),
      with: { medicine: true, center: true, supplier: true },
    })
    if (!batch) return c.json({ error: "Batch not found" }, 404)
    return c.json(batch)
  })
  // Thresholds
  .get("/thresholds", async (c) => {
    const centerId = c.req.query("centerId")
    if (!centerId) return c.json({ error: "centerId required" }, 400)

    const thresholds = await db.query.stockThresholds.findMany({
      where: eq(stockThresholds.centerId, centerId),
      with: { medicine: true },
    })
    return c.json(thresholds)
  })
  .post("/thresholds", requireRole("admin", "pharmacist", "center_manager"), zValidator("json", thresholdSchema), async (c) => {
    const data = c.req.valid("json")
    const [threshold] = await db
      .insert(stockThresholds)
      .values(data)
      .onConflictDoUpdate({
        target: [stockThresholds.centerId, stockThresholds.medicineId],
        set: {
          minimumQuantity: data.minimumQuantity,
          maximumQuantity: data.maximumQuantity,
          reorderQuantity: data.reorderQuantity,
          expiryWarningDays: data.expiryWarningDays,
        },
      })
      .returning()
    return c.json(threshold, 201)
  })
