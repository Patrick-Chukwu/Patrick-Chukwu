# Invoices and receipts

Private billing for this portfolio. It does not change the public pages, logo, or colours. There was no database in this project, so billing uses a local SQLite file. It is not stored in browser localStorage, and it is not stored in any other product database.

## What you get

- Draft, issue, revise, duplicate, and cancel invoices
- Clients and projects you can reuse
- Partial payments, reversals, and receipts linked to those payments
- Dashboard totals calculated from stored records
- A4 PDFs with selectable text

Money is stored as integer minor units (kobo for NGN). The server recalculates totals. Discount and tax are off until you enter them. Currencies are not converted.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `BILLING_ADMIN_PASSWORD` (8+ characters) and `BILLING_SESSION_SECRET` (16+ characters).
3. Install dependencies with `npm install`.
4. Start the site and API with `npm run dev`.
5. Open `http://localhost:5173/billing` and sign in.

`npm run dev` runs Vite and the API. Vite proxies `/api` to port `8787`.

The database file is `data/billing.sqlite` unless `BILLING_DATABASE_PATH` is set. `data/` is gitignored. Copy that file to back it up.

## Production

`npm run build` still builds the static portfolio. `npm start` serves `dist/` and the billing API from one Node process, which needs a persistent disk for the SQLite file.

The existing Vercel config is a static rewrite. A static host cannot keep this SQLite database. Run `npm start` on a host with a disk, or point `BILLING_DATABASE_PATH` at a persistent path. Do not commit the database or `.env`.

## Migrations

On startup the API applies SQL files in `server/migrations` and records them in `schema_migrations`. The first migration creates issuer settings, clients, projects, invoices, line items, milestones, payments, receipts, document revisions, and audit events. Issuer settings are seeded with the name Patrick Chukwu and the public email already on the site. Phone, address, payment instructions, and clients are left empty.

## Access

Every billing read and write checks a signed httpOnly session cookie. Downloads use the same cookie. There are no public invoice links and no email sending. Unsafe requests must include the `X-Billing-Request` header. Payment and receipt creation use an idempotency key so a double submit does not create a second payment or a new receipt number.

## Documents

Issued invoices snapshot the issuer, client, totals, and a copy of the logo. Later client or settings edits do not change them. Editing an issued invoice means starting a revision draft or cancelling it. Cancellation keeps payment history. Reversing a payment keeps any receipt already issued.

PDFs are generated with PDFKit and Noto Sans (SIL Open Font License, see `server/fonts/OFL.txt`). The on-screen preview can also be printed.

## Tests

```bash
npm test
```

Tests use a temporary database and the password `test-password-not-real`. They do not touch live financial records.
