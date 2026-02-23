// Deno adapter for Supabase Edge Functions.
// Imports the Hono app directly from apps/api/src — no build step needed.
import { app } from "../../../apps/api/src/app.ts"

Deno.serve(app.fetch)
