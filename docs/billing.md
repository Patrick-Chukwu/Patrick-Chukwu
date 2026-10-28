# Invoices and receipts

Private billing for this portfolio. It does not change the public pages, logo, or colours. There was no database in this project, so billing uses a local SQLite file. It is not stored in browser localStorage, and it is not stored in any other product database.

## What you get

- Draft, issue, revise, duplicate, and cancel invoices
- Clients and projects you can reuse
- Partial payments, reversals, and receipts linked to those payments
- Dashboard totals calculated from stored records
- A4 PDFs with selectable text

Money is stored as integer minor units (kobo for NGN). The server recalculates totals. Discount and tax are off until you enter them. Currencies are not converted.

## Setup (local)

1. Copy `.env.example` to `.env`.
2. Set `BILLING_ADMIN_PASSWORD` (8+ characters).
3. Install dependencies with `npm install`.
4. Start the site and API with `npm run dev`.
5. Open `http://localhost:5173/billing` and sign in.

`npm run dev` runs Vite and the API. Vite proxies `/api` to port `8787`. Locally the data is a SQLite file, `data/billing.sqlite` unless `BILLING_DATABASE_PATH` is set. `data/` is gitignored. Copy that file to back it up.

## Production on Vercel

The public site is static, so billing runs as a Vercel serverless function: `api/billing/[...path].js` serves every `/api/billing/*` request with the same Express app used locally. `vercel.json` keeps the single-page-app rewrite away from `/api`, so API calls reach the function instead of returning the HTML shell.

Serverless functions have no durable disk, so production needs a hosted libSQL (SQLite-compatible) database such as [Turso](https://turso.tech). The same SQL and migrations run there. Without it, the function refuses to start billing and returns `503 NOT_CONFIGURED` rather than silently using temporary storage.

Set these in Vercel → Project → Settings → Environment Variables, enabled for **Production** (and Preview if you use it; each environment has its own values):

| Variable | Purpose |
| --- | --- |
| `BILLING_ADMIN_PASSWORD` | Admin password, 8+ characters. Server only. Never prefix with `VITE_`. |
| `BILLING_DATABASE_URL` | Database URL, for example `libsql://your-db.turso.io`. |
| `BILLING_DATABASE_AUTH_TOKEN` | Database token. Server only. |

The Turso Vercel integration sets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; those names also work. Environment variable changes apply to new deployments, so redeploy after changing them. `BILLING_SESSION_SECRET` is no longer used.

Create the database and token with the Turso CLI:

```bash
turso db create patrick-billing
turso db show patrick-billing --url
turso db tokens create patrick-billing
```

To move existing local data into Turso, dump and load it: `sqlite3 data/billing.sqlite .dump | turso db shell patrick-billing`. Logo images are stored in the database table `document_assets`; files from the earlier disk-based version are only read when a local `data/` directory exists.

`npm start` still serves `dist/` and the API from one Node process, for hosts that have a persistent disk.

## Migrations

On startup the API applies SQL files in `server/migrations` and records them in `schema_migrations`. The first migration creates issuer settings, clients, projects, invoices, line items, milestones, payments, receipts, document revisions, and audit events. Issuer settings are seeded with the name Patrick Chukwu and the public email already on the site. Phone, address, payment instructions, and clients are left empty.

## Access

Sign-in is checked on the server. `BILLING_ADMIN_PASSWORD` is only read from the server environment, on each request, and is never sent to the browser.

- A successful sign-in creates a random session token. Only its SHA-256 hash is stored in the database, so sessions survive serverless cold starts and can be revoked.
- The cookie is `HttpOnly`, `SameSite=Strict`, and `Secure` on HTTPS and on Vercel (named `__Host-billing_session` there). Sessions last 12 hours.
- Log out deletes the session on the server. Changing `BILLING_ADMIN_PASSWORD` signs every session out.
- Every billing read and write, including PDF and logo downloads, requires a valid session and returns `401` otherwise. If the password or database is not configured, billing returns `503` and does not fall back to anything.
- Failed sign-ins are limited per client (8 per 10 minutes) and globally (60 per 10 minutes), counted in the database so the limit holds across serverless instances.
- Unsafe requests must include the `X-Billing-Request` header and, when the browser sends an `Origin`, it must match the site. Payment and receipt creation use an idempotency key so a double submit does not create a second payment or a new receipt number.

There are no public invoice links, no payment provider integration, no webhooks, and no email sending. Nothing outside `/api/billing` is affected by billing sign-in.

## Documents

Issued invoices snapshot the issuer, client, totals, and a copy of the logo. Later client or settings edits do not change them. Editing an issued invoice means starting a revision draft or cancelling it. Cancellation keeps payment history. Reversing a payment keeps any receipt already issued.

PDFs are generated with PDFKit and Noto Sans (SIL Open Font License, see `server/fonts/OFL.txt`). The on-screen preview can also be printed.

## Tests

```bash
npm test
```

Tests use a temporary database and the password `test-password-not-real`. They do not touch live financial records. They cover sign-in, cookie attributes, rate limiting, expiry, logout, fail-closed configuration, and the Vercel function entry.
