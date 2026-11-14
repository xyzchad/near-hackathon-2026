# split/d/bill application

The application is built with React and Next.js conventions. It runs locally with Vinext and D1, or with native Next.js and Supabase. The local sample uses simulated payments and does not require credentials.

## Local sample

Install Node.js 24 and npm, then run from the repository root:

```sh
cd app-web
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_organic_jimmy_woo.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_complete_bruce_banner.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_durable_live_payments.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_unique_live_deposit.sql
npm run dev -- --port 5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173), choose **Try a sample bill**, enter `nearcom:demo.near` as the synthetic receiving address, and create requests. Open a payer link and simulate payment to see the organizer's status update. No executable payment or transfer is created. Apply the migrations once to a fresh local database; `.wrangler/` holds disposable local data.

## Native Next.js and Supabase

Copy `.env.example` to `.env.local`, set `STORAGE_BACKEND=supabase`, `SUPABASE_URL`, and the server-only `SUPABASE_SERVICE_ROLE_KEY`, and apply the Supabase migrations in order to a fresh project. Then run:

```sh
npm run dev:next
```

Open [http://127.0.0.1:5180](http://127.0.0.1:5180). See `.env.example` for server configuration. Keep credentials out of version control. Payment credentials alone do not activate payments; live payment requests involve real funds and require separate configuration and verification.

## Checks

From `app-web`:

```sh
npm run typecheck
npm test
npm run test:e2e
```

These run TypeScript, Vitest and Playwright checks respectively. Install Playwright browsers with `npx playwright install` if needed. The sample and simulated settlement do not establish live payment or refund acceptance.

## Optional receipt reading

Set `OCR_ENABLED=true` and the server-only `OCR_SPACE_API_KEY` to enable OCR.space receipt reading. Obtain a key from [OCR.space](https://ocr.space/ocrapi) and keep it out of browser code and version control. OCR.space takes precedence when both providers are configured. The app uses Engine 3 for receipt accuracy; its free tier allows 1,000 Engine 3 conversions per month and 500 requests per day per IP, with a 1 MB OCR file limit and JPG/PNG image support in this app. The app accepts JPG, PNG and WebP uploads up to 5 MB, so an accepted upload may still need manual entry.

The organizer opts in before the image is sent to OCR.space. OCR extracts text; the app conservatively suggests a merchant and total, and a currency when unambiguous, for the organizer to review and confirm. A `$` symbol alone leaves currency for manual selection. Extraction is not guaranteed, and manual entry remains available if reading fails or a limit is reached. See [privacy details](../docs/technical/PRIVACY.md).

NEAR AI receipt reading remains optional when configured with server-only `NEAR_AI_API_KEY` and `NEAR_AI_MODEL`, and requires an available image-input model and sufficient credits. Model access, pricing and [privacy tiers](https://docs.near.ai/cloud/models) vary. This application does not verify model attestation or response signatures.
