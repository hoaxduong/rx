import { createMiddleware } from "hono/factory"

type SuperAdminEnv = {
  Variables: {
    user: { id: string; role: string }
  }
}

export const requireSuperAdmin = createMiddleware<SuperAdminEnv>(async (c, next) => {
  const user = c.get("user")

  if (user.role !== "super_admin") {
    return c.json({ error: "Forbidden" }, 403)
  }

  await next()
})
