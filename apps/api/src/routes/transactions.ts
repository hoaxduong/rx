import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { transactions, transactionItems, inventoryBatches } from "@workspace/db/schema"
import { eq, and, desc, sql, asc } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"
import { requireRole } from "../middleware/rbac.ts"
import { centerScope } from "../middleware/center-scope.ts"

const transactionItemSchema = z.object({
  medicineId: z.string().uuid(),
  inventoryBatchId: z.string().uuid().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.string().optional(),
  notes: z.string().optional(),
})

const createTransactionSchema = z.object({
  type: z.enum([
    "inward_supplier", "inward_transfer", "inward_return",
    "outward_prescription", "outward_transfer", "outward_disposal",
    "adjustment_increase", "adjustment_decrease",
  ]),
  centerId: z.string().uuid(),
  targetCenterId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  prescriptionId: z.string().uuid().optional(),
  notes: z.string().optional(),
  metadata: z.any().optional(),
  items: z.array(transactionItemSchema).min(1),
})

function generateTransactionCode(type: string): string {
  const prefix = type.startsWith("inward") ? "IN" : type.startsWith("outward") ? "OUT" : "ADJ"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export const transactionsRoute = new Hono()
  .use("*", requireAuth)
  .use("*", centerScope)
  // Transaction history
  .get("/", async (c) => {
    const { centerId, type, page = "1", limit = "20" } = c.req.query()
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const offset = (Number(page) - 1) * Number(limit)

    const conditions = [sql`${transactions.centerId} = ANY(${centerId ? [centerId] : authorizedCenterIds})`]
    if (type) conditions.push(eq(transactions.type, type as any))

    const result = await db.query.transactions.findMany({
      where: and(...conditions),
      with: {
        items: { with: { medicine: true } },
        performer: true,
        supplier: true,
        center: true,
        targetCenter: true,
      },
      limit: Number(limit),
      offset,
      orderBy: [desc(transactions.createdAt)],
    })

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions))

    return c.json({ data: result, total: Number(countResult[0]?.count ?? 0), page: Number(page), limit: Number(limit) })
  })
  // Transaction detail
  .get("/:id", async (c) => {
    const { id } = c.req.param()
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: {
        items: { with: { medicine: true, inventoryBatch: true } },
        performer: true,
        approver: true,
        supplier: true,
        center: true,
        targetCenter: true,
        prescription: true,
      },
    })
    if (!transaction) return c.json({ error: "Transaction not found" }, 404)
    return c.json(transaction)
  })
  // Create transaction (inward/outward/adjust)
  .post(
    "/",
    requireRole("admin", "pharmacist", "center_manager"),
    zValidator("json", createTransactionSchema),
    async (c) => {
      const data = c.req.valid("json")
      const user = c.get("user")

      const result = await db.transaction(async (tx) => {
        // Create transaction header
        const [txn] = await tx
          .insert(transactions)
          .values({
            transactionCode: generateTransactionCode(data.type),
            type: data.type,
            centerId: data.centerId,
            targetCenterId: data.targetCenterId,
            transferStatus: data.targetCenterId ? "pending" : undefined,
            supplierId: data.supplierId,
            invoiceNumber: data.invoiceNumber,
            invoiceDate: data.invoiceDate,
            prescriptionId: data.prescriptionId,
            performedBy: user.id,
            notes: data.notes,
            metadata: data.metadata,
          })
          .returning()

        let totalAmount = 0

        for (const item of data.items) {
          const isInward = data.type.startsWith("inward") || data.type === "adjustment_increase"

          if (isInward) {
            // Create or update batch
            let batchId = item.inventoryBatchId
            if (!batchId && item.batchNumber && item.expiryDate) {
              const [batch] = await tx
                .insert(inventoryBatches)
                .values({
                  centerId: data.centerId,
                  medicineId: item.medicineId,
                  supplierId: data.supplierId,
                  batchNumber: item.batchNumber,
                  expiryDate: item.expiryDate,
                  quantity: 0,
                  unitPrice: item.unitPrice,
                  invoiceNumber: data.invoiceNumber,
                  invoiceDate: data.invoiceDate,
                })
                .returning()
              batchId = batch!.id
            }

            if (batchId) {
              // Get current stock
              const batch = await tx.query.inventoryBatches.findFirst({
                where: eq(inventoryBatches.id, batchId),
              })
              const stockBefore = batch?.quantity || 0
              const stockAfter = stockBefore + item.quantity

              await tx
                .update(inventoryBatches)
                .set({ quantity: stockAfter })
                .where(eq(inventoryBatches.id, batchId))

              const itemTotal = item.unitPrice
                ? String(Number(item.unitPrice) * item.quantity)
                : undefined

              await tx.insert(transactionItems).values({
                transactionId: txn!.id,
                inventoryBatchId: batchId,
                medicineId: item.medicineId,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: itemTotal,
                stockBefore,
                stockAfter,
                notes: item.notes,
              })

              if (itemTotal) totalAmount += Number(itemTotal)
            }
          } else {
            // Outward/decrease - use FEFO (First Expiry First Out)
            let remaining = item.quantity

            if (item.inventoryBatchId) {
              // Specific batch selected
              const batch = await tx.query.inventoryBatches.findFirst({
                where: eq(inventoryBatches.id, item.inventoryBatchId),
              })
              if (!batch || batch.quantity < remaining) {
                throw new Error(`Insufficient stock in batch ${item.inventoryBatchId}`)
              }
              const stockBefore = batch.quantity
              const stockAfter = stockBefore - remaining

              await tx
                .update(inventoryBatches)
                .set({ quantity: stockAfter })
                .where(eq(inventoryBatches.id, item.inventoryBatchId))

              await tx.insert(transactionItems).values({
                transactionId: txn!.id,
                inventoryBatchId: item.inventoryBatchId,
                medicineId: item.medicineId,
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                quantity: remaining,
                unitPrice: batch.unitPrice,
                totalPrice: batch.unitPrice ? String(Number(batch.unitPrice) * remaining) : undefined,
                stockBefore,
                stockAfter,
                notes: item.notes,
              })
            } else {
              // FEFO: pick from earliest expiring batches
              const batches = await tx.query.inventoryBatches.findMany({
                where: and(
                  eq(inventoryBatches.centerId, data.centerId),
                  eq(inventoryBatches.medicineId, item.medicineId),
                  sql`${inventoryBatches.quantity} > 0`
                ),
                orderBy: [asc(inventoryBatches.expiryDate)],
              })

              for (const batch of batches) {
                if (remaining <= 0) break
                const take = Math.min(remaining, batch.quantity)
                const stockBefore = batch.quantity
                const stockAfter = stockBefore - take

                await tx
                  .update(inventoryBatches)
                  .set({ quantity: stockAfter })
                  .where(eq(inventoryBatches.id, batch.id))

                await tx.insert(transactionItems).values({
                  transactionId: txn!.id,
                  inventoryBatchId: batch.id,
                  medicineId: item.medicineId,
                  batchNumber: batch.batchNumber,
                  expiryDate: batch.expiryDate,
                  quantity: take,
                  unitPrice: batch.unitPrice,
                  totalPrice: batch.unitPrice ? String(Number(batch.unitPrice) * take) : undefined,
                  stockBefore,
                  stockAfter,
                  notes: item.notes,
                })

                remaining -= take
              }

              if (remaining > 0) {
                throw new Error(`Insufficient stock for medicine ${item.medicineId}`)
              }
            }
          }
        }

        // Update total amount
        if (totalAmount > 0) {
          await tx
            .update(transactions)
            .set({ totalAmount: String(totalAmount) })
            .where(eq(transactions.id, txn!.id))
        }

        return txn
      })

      return c.json(result, 201)
    }
  )
  // Update transfer status
  .patch(
    "/:id/transfer-status",
    requireRole("admin", "pharmacist", "center_manager"),
    zValidator("json", z.object({ status: z.enum(["in_transit", "received", "rejected"]) })),
    async (c) => {
      const { id } = c.req.param()
      const { status } = c.req.valid("json")
      const user = c.get("user")

      const [txn] = await db
        .update(transactions)
        .set({
          transferStatus: status,
          approvedBy: status === "received" ? user.id : undefined,
        })
        .where(eq(transactions.id, id))
        .returning()

      if (!txn) return c.json({ error: "Transaction not found" }, 404)
      return c.json(txn)
    }
  )
