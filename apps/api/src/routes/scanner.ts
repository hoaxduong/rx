import { Hono } from "hono"
import { db } from "@workspace/db"
import { medicines, inventoryBatches } from "@workspace/db/schema"
import { eq, or } from "@workspace/db"
import { requireAuth } from "../middleware/auth.ts"

export const scannerRoute = new Hono()
  .use("*", requireAuth)
  // Lookup by barcode/QR code
  .get("/lookup", async (c) => {
    const code = c.req.query("code")
    if (!code) return c.json({ error: "code parameter required" }, 400)

    // Try medicine barcode first
    const medicine = await db.query.medicines.findFirst({
      where: eq(medicines.barcode, code),
      with: { category: true },
    })

    if (medicine) {
      return c.json({ type: "medicine", data: medicine })
    }

    // Try batch barcode
    const batch = await db.query.inventoryBatches.findFirst({
      where: eq(inventoryBatches.batchBarcode, code),
      with: { medicine: true, center: true },
    })

    if (batch) {
      return c.json({ type: "batch", data: batch })
    }

    return c.json({ error: "No match found for code" }, 404)
  })
