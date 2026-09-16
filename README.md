# Ledger · Huvathu Pvt

A mobile-responsive business workspace built with Next.js, React, and TypeScript.

## What is included

- Sales, itemized invoices, discounts, optional VAT, and automatically created delivery notes.
- Customer profiles, price groups, credit limits, aging, and partial collections.
- Products, inventory, customer rates, purchase orders, and fuel reconciliation.
- Date-filtered sales reports with PDF, Excel, and CSV exports.
- Gemini chat plus deterministic workflows for reports, balance lookups, stock checks, and opening forms.
- Team permission rules, customer-scoped data, change history, and the last 30 workspace snapshots.
- TextBee integration for invoice notifications and customer reminders.

## Run locally

Requires Node.js 20.9 or newer; Node 22 is recommended.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set the integrations you want.
3. Run `npm run dev` and open [localhost:3000](http://localhost:3000).
4. Use the demo sign-in for Unoosh Ahmed / Huvathu Pvt.

Without Redis credentials, development stores records in ignored `.local-data/store.json`. Changes use a file lock and atomic replacement. On Vercel/production, Redis is required and writes use an atomic revision check.

## Environment

| Variable | Purpose |
| --- | --- |
| GEMINI_API_KEY | Server-only Google Gemini key |
| GEMINI_MODEL | Defaults to gemini-3.5-flash-lite |
| TEXTBEE_API_KEY | Optional SMS integration |
| TEXTBEE_DEVICE_ID | Registered Android gateway device |
| KV_REST_API_URL / KV_REST_API_TOKEN | Upstash Redis REST endpoint and token |
| SESSION_SECRET | Random secret of at least 32 characters for deployed sessions |
| LEDGER_DEMO_MODE | Explicitly set true only for an intentionally shared demo |

The Upstash aliases `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` also work. Keys and local data are ignored by Git. No credentials are needed for tests or a build.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

Tests cover invoice math, credit limits, stock, partial payments, date ranges, customer isolation, concurrent writes, and signed sessions. GitHub Actions runs tests and a production build on main and pull requests. Tests use isolated fixtures and send no SMS.

## Current deployment boundaries

- This is a **single-owner demo login**, not a complete production identity system. Local demo access is enabled; production access is disabled unless `LEDGER_DEMO_MODE=true`. Demo mode gives every admitted visitor the same owner identity. Configure proper authentication before using real business records.
- The latest workspace changes target **Vercel / standard Next.js**, replacing the earlier Sites/Cloudflare runtime. Legacy build files are retained for reference and excluded from TypeScript builds.
- Document/payment-slip uploads are currently disabled by the Vercel migration until an object store is connected.
- SMS reminders run on workspace access and after relevant transactions; they are not an unattended scheduler or a durable delivery queue. Configure TextBee deliberately before using real phone numbers.
- The workspace is one JSON document with optimistic concurrency. This is suitable for a small demonstration; larger deployments should move records and message jobs to dedicated tables.
- Reports use invoice dates for sales and payment dates for collections. Profit excludes VAT. Product filters include whole matching invoices; expenses cover the entire business.
- Seed data is marked as sample data. Existing local data is not uploaded to GitHub.

See [VERCEL_MIGRATION.md](VERCEL_MIGRATION.md) for migration background. [HUVATHU_SETUP.md](HUVATHU_SETUP.md) describes the earlier Cloudflare/SMS.to iteration; the instructions above describe the current app.

