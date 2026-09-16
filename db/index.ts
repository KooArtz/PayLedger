// Deprecated. The app now stores its data as a single JSON document via lib/store.ts (Vercel KV / Upstash Redis).
// Kept only so any stale import resolves; it is no longer used anywhere.
export function getDb(): never {
  throw new Error("getDb() is no longer used — data is stored as JSON via lib/store.ts.");
}
