import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { env } from "./lib/env.ts"
import { authRoute } from "./routes/auth.ts"
import { centersRoute } from "./routes/centers.ts"
import { medicinesRoute } from "./routes/medicines.ts"
import { inventoryRoute } from "./routes/inventory.ts"
import { transactionsRoute } from "./routes/transactions.ts"
import { suppliersRoute } from "./routes/suppliers.ts"
import { alertsRoute } from "./routes/alerts.ts"
import { reportsRoute } from "./routes/reports.ts"
import { usersRoute } from "./routes/users.ts"
import { scannerRoute } from "./routes/scanner.ts"
import { adminRoute } from "./routes/admin.ts"

const app = new Hono().basePath("/api")

app.use(
  "*",
  cors({
    origin: env("FRONTEND_URL") || "http://localhost:3000",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
)

app.use("*", logger())

const routes = app
  .route("/auth", authRoute)
  .route("/centers", centersRoute)
  .route("/medicines", medicinesRoute)
  .route("/inventory", inventoryRoute)
  .route("/transactions", transactionsRoute)
  .route("/suppliers", suppliersRoute)
  .route("/alerts", alertsRoute)
  .route("/reports", reportsRoute)
  .route("/users", usersRoute)
  .route("/scanner", scannerRoute)
  .route("/admin", adminRoute)

app.get("/health", (c) => c.json({ status: "ok" }))

export type AppType = typeof routes
export { app }
