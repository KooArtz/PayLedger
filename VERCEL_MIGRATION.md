# Ledger — Vercel migration (JSON store + TextBee)

The app was built for Cloudflare (D1 + `cloudflare:workers` + vinext). I've migrated it to run as a **standard Next.js app on Vercel**, storing all data as **one JSON document in a KV store** (Upstash Redis / Vercel KV). The screens, SMS, and notifications are unchanged.

## What changed

- **Data**: Cloudflare D1 → a JSON document in KV (`lib/store.ts`). The whole workspace is one JSON value under the key `ws:huvathu-main`; the last 30 snapshots live under `snap:huvathu-main`. No SQL, no schema, no migrations.
- **Env**: `import { env } from "cloudflare:workers"` → `lib/env.ts` (reads `process.env`). Works on Vercel/Node.
- **Auth**: the Cloudflare "Sign in with ChatGPT" mock → a simple cookie session (`app/api/auth`). Clicking **Sign in as Unoosh Ahmed** signs you in with no password, same as before.
- **Build**: vinext/wrangler → plain Next.js (`next dev` / `next build` / `next start`). Dev now runs on **http://localhost:3000**.
- **Attachments**: the payment-slip upload used Cloudflare R2, which Vercel doesn't have. It's disabled gracefully for now (see Limitations).

## Run it locally

1. Refresh dependencies (the dependency list changed):

    ```
    npm install
    ```

2. Fill in `.env.local` (already created, keys pre-filled) with your KV credentials — see the next section — then:

    ```
    npm run dev
    ```

   Open **http://localhost:3000** and click **Sign in as Unoosh Ahmed**.

## Set up the JSON store (KV)

The app needs a KV store for its JSON document. Two easy options:

- **Vercel KV**: Vercel dashboard → your project → **Storage** → **Create Database** → **KV** (it's Upstash under the hood). Vercel auto-adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project's env.
- **Upstash directly**: create a Redis database at upstash.com and copy its **REST URL** and **REST TOKEN**.

Put those two values in `.env.local` for local dev, and in Vercel's Environment Variables for production. The code accepts either `KV_REST_API_URL`/`KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`.

## Environment variables (set these in Vercel → Settings → Environment Variables)

```
GEMINI_API_KEY=...           # assistant (optional)
GEMINI_MODEL=gemini-3.5-flash-lite
TEXTBEE_API_KEY=txb_...      # SMS
TEXTBEE_DEVICE_ID=...        # your registered TextBee Android device
KV_REST_API_URL=...          # JSON store
KV_REST_API_TOKEN=...
```

## Deploy

1. Run `npm install` locally first so `package-lock.json` matches the new dependencies (Vercel's install fails on a stale lock).
2. Push the project to GitHub (or run `vercel`).
3. Import the repo in Vercel, add the environment variables above, and deploy.
4. First load seeds the Huvathu Pvt demo data into KV automatically.

## Optional cleanup (safe to delete — all Cloudflare/vinext leftovers, no longer used)

`vite.config.ts`, `build/`, `worker/`, `scripts/`, `drizzle/`, `drizzle.config.ts`, `db/schema.ts`, `.wrangler/`, `.vinext/`, `dist/`, `.openai/`, `.sites-runtime/`, `examples/`. They're already excluded from the build, so deleting them is just tidying.

## Known limitation

- **Document/payment-slip uploads** are turned off (they used Cloudflare R2). To re-enable on Vercel, wire up **Vercel Blob** in `app/api/attachments/route.ts` — tell me and I'll do it.
