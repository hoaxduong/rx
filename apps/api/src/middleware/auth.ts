import { createMiddleware } from "hono/factory"
import { auth } from "../lib/auth.ts"

type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  fullNameVi?: string | null
  professionalLicense?: string | null
}

type AuthEnv = {
  Variables: {
    user: AuthUser
    session: { id: string; userId: string; token: string; expiresAt: Date }
  }
}

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  c.set("user", session.user as AuthUser)
  c.set("session", session.session)
  await next()
})
