import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { db } from "@workspace/db"
import { centers } from "@workspace/db/schema"
import { eq, and, isNull } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"
import { requireRole } from "../middleware/rbac.ts"
import { centerScope } from "../middleware/center-scope.ts"

const createCenterSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(["commune", "satellite"]),
  parentId: z.string().uuid().optional(),
  address: z.string().optional(),
  wardCode: z.string().optional(),
  districtCode: z.string().optional(),
  provinceCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  licenseNumber: z.string().optional(),
})

const updateCenterSchema = createCenterSchema.partial()

export const centersRoute = new Hono()
  .use("*", requireAuth)
  .use("*", centerScope)
  .get("/", async (c) => {
    const authorizedCenterIds = c.get("authorizedCenterIds")
    const result = await db.query.centers.findMany({
      where: (centers, { inArray }) => inArray(centers.id, authorizedCenterIds),
      with: { children: true },
    })
    return c.json(result)
  })
  .get("/:id", async (c) => {
    const { id } = c.req.param()
    const center = await db.query.centers.findFirst({
      where: eq(centers.id, id),
      with: { children: true, parent: true },
    })
    if (!center) return c.json({ error: "Center not found" }, 404)
    return c.json(center)
  })
  .post("/", requireRole("admin"), zValidator("json", createCenterSchema), async (c) => {
    const data = c.req.valid("json")
    const [center] = await db.insert(centers).values(data).returning()
    return c.json(center, 201)
  })
  .put("/:id", requireRole("admin", "center_manager"), zValidator("json", updateCenterSchema), async (c) => {
    const { id } = c.req.param()
    const data = c.req.valid("json")
    const [center] = await db.update(centers).set(data).where(eq(centers.id, id)).returning()
    if (!center) return c.json({ error: "Center not found" }, 404)
    return c.json(center)
  })
