import { Hono } from "hono"
import { auth } from "../lib/auth.ts"

export const authRoute = new Hono()
  .all("/*", (c) => auth.handler(c.req.raw))
