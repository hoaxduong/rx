import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { suppliers } from "@workspace/db/schema"
import { eq, ilike, or, asc } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"
import { requireRole } from "../middleware/rbac.ts"

const supplierSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  licenseNumber: z.string().optional(),
  certificates: z.any().optional(),
})

export const suppliersRoute = new Hono()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const search = c.req.query("search")
    const conditions = search
      ? or(ilike(suppliers.name, `%${search}%`), ilike(suppliers.code, `%${search}%`))
      : undefined

    const result = await db.query.suppliers.findMany({
      where: conditions,
      orderBy: [asc(suppliers.name)],
    })
    return c.json(result)
  })
  .get("/:id", async (c) => {
    const { id } = c.req.param()
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, id),
    })
    if (!supplier) return c.json({ error: "Supplier not found" }, 404)
    return c.json(supplier)
  })
  .post("/", requireRole("admin", "pharmacist"), zValidator("json", supplierSchema), async (c) => {
    const data = c.req.valid("json")
    const [supplier] = await db.insert(suppliers).values(data).returning()
    return c.json(supplier, 201)
  })
  .put("/:id", requireRole("admin", "pharmacist"), zValidator("json", supplierSchema.partial()), async (c) => {
    const { id } = c.req.param()
    const data = c.req.valid("json")
    const [supplier] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning()
    if (!supplier) return c.json({ error: "Supplier not found" }, 404)
    return c.json(supplier)
  })
