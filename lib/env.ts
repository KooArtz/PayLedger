// Server-side environment accessor for Vercel / Node.
// Replaces the Cloudflare `import { env } from "cloudflare:workers"` binding.
export const env: Record<string, string | undefined> =
  (typeof process !== "undefined" && process.env) ? (process.env as Record<string, string | undefined>) : {};
