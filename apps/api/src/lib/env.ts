/**
 * Universal environment variable access.
 * Works in Node.js, Deno, and Cloudflare Workers.
 */
export function env(key: string): string | undefined {
  // Deno
  if (typeof (globalThis as any).Deno !== "undefined") {
    return (globalThis as any).Deno.env.get(key)
  }
  // Node.js / Bun
  if (typeof process !== "undefined" && process.env) {
    return process.env[key]
  }
  return undefined
}
