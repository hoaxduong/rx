import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { medicines, medicineCategories, transactionItems, transactions, inventoryBatches } from "@workspace/db/schema"
import { eq, and, like, ilike, or, desc, asc, sql } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"
import { requireRole } from "../middleware/rbac.ts"

const createMedicineSchema = z.object({
  name: z.string().min(1),
  nameVi: z.string().optional(),
  brandName: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  activeIngredient: z.string().optional(),
  dosageForm: z.enum(["tablet", "capsule", "syrup", "injection", "cream", "ointment", "drops", "powder", "suspension", "solution", "suppository", "inhaler", "patch", "gel", "other"]).optional(),
  strength: z.string().optional(),
  unit: z.enum(["tablet", "capsule", "bottle", "ampoule", "vial", "tube", "sachet", "box", "strip", "ml", "g", "mg", "piece", "set"]).optional(),
  packagingSpec: z.string().optional(),
  registrationNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  storageCondition: z.enum(["room_temperature", "cool", "refrigerated", "frozen", "controlled"]).optional(),
  isNarcotics: z.boolean().optional(),
  isPsychotropic: z.boolean().optional(),
  isPrescriptionOnly: z.boolean().optional(),
  isEssentialDrug: z.boolean().optional(),
  dinhMucBhyt: z.string().optional(),
  barcode: z.string().optional(),
  atcCode: z.string().optional(),
  contraindications: z.string().optional(),
  sideEffects: z.string().optional(),
  interactions: z.any().optional(),
})

const updateMedicineSchema = createMedicineSchema.partial()

const createCategorySchema = z.object({
  name: z.string().min(1),
  nameVi: z.string().optional(),
  code: z.string().min(1),
  parentId: z.string().uuid().optional(),
  description: z.string().optional(),
})

export const medicinesRoute = new Hono()
  .use("*", requireAuth)
  // Categories
  .get("/categories", async (c) => {
    const result = await db.query.medicineCategories.findMany({
      with: { children: true },
    })
    return c.json(result)
  })
  .post("/categories", requireRole("admin", "pharmacist"), zValidator("json", createCategorySchema), async (c) => {
    const data = c.req.valid("json")
    const [category] = await db.insert(medicineCategories).values(data).returning()
    return c.json(category, 201)
  })
  // Medicines
  .get("/", async (c) => {
    const { search, categoryId, dosageForm, page = "1", limit = "20" } = c.req.query()
    const offset = (Number(page) - 1) * Number(limit)

    const conditions = [eq(medicines.isActive, true)]
    if (search) {
      conditions.push(
        or(
          ilike(medicines.name, `%${search}%`),
          ilike(medicines.nameVi, `%${search}%`),
          ilike(medicines.activeIngredient, `%${search}%`),
          ilike(medicines.barcode, `%${search}%`)
        )!
      )
    }
    if (categoryId) conditions.push(eq(medicines.categoryId, categoryId))
    if (dosageForm) conditions.push(eq(medicines.dosageForm, dosageForm as any))

    const result = await db.query.medicines.findMany({
      where: and(...conditions),
      with: { category: true },
      limit: Number(limit),
      offset,
      orderBy: [asc(medicines.name)],
    })

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(medicines)
      .where(and(...conditions))

    return c.json({ data: result, total: Number(countResult[0]?.count ?? 0), page: Number(page), limit: Number(limit) })
  })
  .get("/:id", async (c) => {
    const { id } = c.req.param()
    const medicine = await db.query.medicines.findFirst({
      where: eq(medicines.id, id),
      with: { category: true },
    })
    if (!medicine) return c.json({ error: "Medicine not found" }, 404)
    return c.json(medicine)
  })
  .get("/:id/stock", async (c) => {
    const { id } = c.req.param()
    const centerId = c.req.query("centerId")

    const conditions = [eq(inventoryBatches.medicineId, id)]
    if (centerId) conditions.push(eq(inventoryBatches.centerId, centerId))

    const batches = await db.query.inventoryBatches.findMany({
      where: and(...conditions),
      with: { center: true, supplier: true },
      orderBy: [asc(inventoryBatches.expiryDate)],
    })

    return c.json(batches)
  })
  .get("/:id/stock-card", async (c) => {
    const { id } = c.req.param()
    const centerId = c.req.query("centerId")

    if (!centerId) return c.json({ error: "centerId required" }, 400)

    const items = await db
      .select({
        id: transactionItems.id,
        transactionId: transactionItems.transactionId,
        batchNumber: transactionItems.batchNumber,
        expiryDate: transactionItems.expiryDate,
        quantity: transactionItems.quantity,
        unitPrice: transactionItems.unitPrice,
        stockBefore: transactionItems.stockBefore,
        stockAfter: transactionItems.stockAfter,
        notes: transactionItems.notes,
        transactionCode: transactions.transactionCode,
        transactionType: transactions.type,
        createdAt: transactions.createdAt,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(
        and(
          eq(transactionItems.medicineId, id),
          eq(transactions.centerId, centerId)
        )
      )
      .orderBy(asc(transactions.createdAt))

    return c.json(items)
  })
  .post("/", requireRole("admin", "pharmacist"), zValidator("json", createMedicineSchema), async (c) => {
    const data = c.req.valid("json")
    const [medicine] = await db.insert(medicines).values(data).returning()
    return c.json(medicine, 201)
  })
  .put("/:id", requireRole("admin", "pharmacist"), zValidator("json", updateMedicineSchema), async (c) => {
    const { id } = c.req.param()
    const data = c.req.valid("json")
    const [medicine] = await db.update(medicines).set(data).where(eq(medicines.id, id)).returning()
    if (!medicine) return c.json({ error: "Medicine not found" }, 404)
    return c.json(medicine)
  })
