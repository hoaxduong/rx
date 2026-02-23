import { hc } from "hono/client"
import type { AppType } from "../../api/src/app.js"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export const api = hc<AppType>(apiUrl, {
  headers: () => ({
    "Content-Type": "application/json",
  }),
  init: {
    credentials: "include",
  },
})
