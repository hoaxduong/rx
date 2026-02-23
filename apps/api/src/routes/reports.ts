import { Hono } from "hono"
import { db } from "@workspace/db"
import { transactions, transactionItems, inventoryBatches, medicines } from "@workspace/db/schema"
import { eq, and, sql, gte, lte, desc, asc, inArray } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"
import { centerScope } from "../middleware/center-scope.ts"

export const reportsRoute = new Hono()
  .use("*", requireAuth)
  .use("*", centerScope)
  // Consumption report: medicines consumed per period
  .get("/consumption", async (c) => {
    const { centerId, from, to, medicineId } = c.req.query()
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const targetCenterIds = centerId ? [centerId] : authorizedCenterIds

    const conditions = [
      inArray(transactions.centerId, targetCenterIds),
      sql`${transactions.type} IN ('outward_prescription', 'outward_transfer', 'outward_disposal')`,
    ]
    if (from) conditions.push(gte(transactions.createdAt, new Date(from)))
    if (to) conditions.push(lte(transactions.createdAt, new Date(to)))

    const itemConditions = medicineId ? [eq(transactionItems.medicineId, medicineId)] : []

    const consumption = await db
      .select({
        medicineId: transactionItems.medicineId,
        medicineName: medicines.name,
        medicineNameVi: medicines.nameVi,
        totalQuantity: sql<number>`sum(${transactionItems.quantity})`.as("total_quantity"),
        totalValue: sql<number>`sum(COALESCE(${transactionItems.totalPrice}::numeric, 0))`.as("total_value"),
        transactionCount: sql<number>`count(DISTINCT ${transactions.id})`.as("transaction_count"),
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(medicines, eq(transactionItems.medicineId, medicines.id))
      .where(and(...conditions, ...itemConditions))
      .groupBy(transactionItems.medicineId, medicines.name, medicines.nameVi)
      .orderBy(desc(sql`sum(${transactionItems.quantity})`))

    return c.json(consumption)
  })
  // Expiry forecast
  .get("/expiry-forecast", async (c) => {
    const { centerId } = c.req.query()
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const targetCenterIds = centerId ? [centerId] : authorizedCenterIds

    const now = new Date()
    const in30 = new Date(now); in30.setDate(in30.getDate() + 30)
    const in60 = new Date(now); in60.setDate(in60.getDate() + 60)
    const in90 = new Date(now); in90.setDate(in90.getDate() + 90)

    const forecast = await db
      .select({
        period: sql<string>`
          CASE
            WHEN ${inventoryBatches.expiryDate} < ${now.toISOString().split("T")[0]} THEN 'expired'
            WHEN ${inventoryBatches.expiryDate} <= ${in30.toISOString().split("T")[0]} THEN '30_days'
            WHEN ${inventoryBatches.expiryDate} <= ${in60.toISOString().split("T")[0]} THEN '60_days'
            WHEN ${inventoryBatches.expiryDate} <= ${in90.toISOString().split("T")[0]} THEN '90_days'
          END
        `.as("period"),
        batchCount: sql<number>`count(*)`.as("batch_count"),
        totalQuantity: sql<number>`sum(${inventoryBatches.quantity})`.as("total_quantity"),
        totalValue: sql<number>`sum(${inventoryBatches.quantity} * COALESCE(${inventoryBatches.unitPrice}::numeric, 0))`.as("total_value"),
      })
      .from(inventoryBatches)
      .where(
        and(
          inArray(inventoryBatches.centerId, targetCenterIds),
          lte(inventoryBatches.expiryDate, in90.toISOString().split("T")[0]!),
          sql`${inventoryBatches.quantity} > 0`
        )
      )
      .groupBy(sql`period`)

    return c.json(forecast)
  })
  // Inventory summary
  .get("/inventory-summary", async (c) => {
    const { centerId } = c.req.query()
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const targetCenterIds = centerId ? [centerId] : authorizedCenterIds

    const summary = await db
      .select({
        centerId: inventoryBatches.centerId,
        totalMedicines: sql<number>`count(DISTINCT ${inventoryBatches.medicineId})`.as("total_medicines"),
        totalBatches: sql<number>`count(*)`.as("total_batches"),
        totalQuantity: sql<number>`sum(${inventoryBatches.quantity})`.as("total_quantity"),
        totalValue: sql<number>`sum(${inventoryBatches.quantity} * COALESCE(${inventoryBatches.unitPrice}::numeric, 0))`.as("total_value"),
      })
      .from(inventoryBatches)
      .where(
        and(
          inArray(inventoryBatches.centerId, targetCenterIds),
          sql`${inventoryBatches.quantity} > 0`
        )
      )
      .groupBy(inventoryBatches.centerId)

    return c.json(summary)
  })
