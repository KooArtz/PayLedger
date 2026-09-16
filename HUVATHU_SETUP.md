# Huvathu Pvt — Ledger demo: what changed & how to run

I picked up where the earlier build stopped and added three things you asked for: a no‑password demo login as **Unoosh Ahmed / Huvathu Pvt**, refreshed dummy data, and full **SMS.to** notifications (automatic payment confirmations, automatic 20‑day overdue reminders, and manual sends). Everything runs inside the existing project.

## How to run

1. Open a terminal in `C:\Users\Aman\Desktop\app_projects\ledger_app`.
2. If the dev server is still running from before, stop it (Ctrl+C) so it picks up the new code.
3. Start it again:

    ```
    npm run dev
    ```

   (If dependencies were never installed: `npm run install:ci` first. No new packages were added by these changes.)
4. Open http://localhost:5173

If you ever see a "no such table" style error, the local database just needs the one migration applied — build once and run it:

```
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_freezing_the_order.sql
```

## Signing in (no password)

On the landing screen click **“Sign in as Unoosh Ahmed.”** That's it — no password. You're signed in as the workspace owner (Super admin) of **Huvathu Pvt**.

Behind the scenes this uses the framework's built‑in local dev sign‑in, and I mapped that identity to **Unoosh Ahmed** and the business name to **Huvathu Pvt**. I also gave the workspace a fresh id, so a brand‑new Huvathu Pvt workspace with fresh dummy data is created automatically the first time you open it — your earlier "Island Trading Co." data is left untouched, not deleted.

## Dummy data

The fresh workspace is seeded with 8 customers, 8 products (incl. fuel), ~6 weeks of invoices/payments, deliveries, purchase orders, fuel meter readings, expenses, and one sample SMS in the log. Several credit invoices are more than 20 days overdue on purpose, so the reminder feature has something to act on.

The sample customers use placeholder Maldives numbers (+960 777 12xx) which **won't deliver** real texts — that's expected. Add a customer with your own real number (Customers → Add customer) to actually receive SMS.

## SMS features (SMS.to)

- **Payment confirmation — automatic.** Record a payment and the customer is texted a confirmation with the amount and remaining balance. Runs server‑side right after the payment saves.
- **Overdue reminder — automatic from the backend.** Any invoice more than **20 days** overdue is texted automatically (once, then not again for 7 days). The sweep runs on the server whenever the workspace loads, at most once per day, and only while **Settings → Overdue credit reminders** is on. For true unattended scheduling on a deployed site, point a Cloudflare Cron Trigger (or any scheduler) at `POST /api/sms` with `{"mode":"due","days":20}`.
- **Manual send.** Open any invoice → **Send SMS reminder**, or on **Credit management** use **Send overdue reminders** to text everyone overdue at once.
- **From the assistant.** Ask Ledger things like *“send a reminder to Maafushi Hardware”* or *“send overdue reminders.”* (This is wired through the same hard‑coded intent layer the rest of the assistant uses.)

Every send is logged: see it per‑invoice under **SMS notifications** in the invoice panel, and in the **Activity log**. Failed sends (e.g. the placeholder numbers) are recorded as *Failed* so you can tell what happened.

Check the connection anytime: **Settings → Notification channels → Check SMS balance**.

## Where the keys live (and a note)

Your SMS.to key is stored server‑side in `.dev.vars` (which the dev server reads) and is never sent to the browser. The plain `.env` file couldn't be written automatically for safety reasons — the app doesn't need it for SMS, but if you want the key there too, add these two lines to `.env`:

```
SMSTO_API_KEY=<your sms.to key>
SMSTO_SENDER_ID=
```

`SMSTO_SENDER_ID` is optional — leave it blank to use your SMS.to account default, or set a registered sender ID. Since both the Gemini and SMS.to keys were pasted into chat, consider rotating them if this conversation is ever shared.

## Files changed

New: `lib/sms.ts`, `app/api/sms/route.ts`.
Updated: `lib/model.ts`, `lib/operations.ts`, `lib/server.ts`, `lib/intents.ts`, `app/api/workspace/route.ts`, `app/api/chat/route.ts`, `app/details.tsx`, `app/pages.tsx`, `app/workspace.tsx`, `cloudflare-env.d.ts`, `.dev.vars`, `.env.example`.
