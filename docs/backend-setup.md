# Backend operations

Target: `KEN THE PHOTOGRAPHER Project`, ref `jurnsxyyahltltfrljls`. Source branch: `codex/archive-commercial-upgrade`. Hosting stays on the existing Cloudflare Pages project.

## Files and runtime

- `supabase/config.toml`: local Supabase configuration and explicit per-function JWT settings.
- `supabase/migrations/20260927200355_archive_backend.sql`: inquiries, bookings, communications, encrypted OAuth token storage, single-use OAuth states, distributed rate counters and short-lived Calendar leases; indexes, RLS and restricted RPC grants.
- `supabase/functions/{submit-inquiry,create-booking,update-booking,google-oauth-callback,gemini-assist}/index.ts`: Deno Edge Function entrypoints.
- `supabase/functions/_shared/`: validation, bounded HTTP bodies, CORS, admin authentication, database REST client, Google OAuth refresh/encryption, Gmail, Calendar, Gemini and workflows.
- `src/inquiry-client.js`: browser-safe function caller.
- `app.js` and inquiry-only markup in `index.html`: server submission, loading/errors, preserved image references, idempotent retries and received confirmation.
- `supabase/tests/backend_test.ts`, `supabase/tests/security.sql`: mocked integration tests and actual database permission checks.

No existing archive table is modified. No frontend layout, colors, cursor, animation, navigation, audio or archive images are changed.

## Server configuration

Set only in Supabase Edge Function secrets:

| Secret | Purpose |
| --- | --- |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google OAuth web client |
| GOOGLE_REDIRECT_URI | Exact deployed callback URL |
| GOOGLE_WORKSPACE_EMAIL | info@kenthephotographer.com |
| GOOGLE_CALENDAR_ID | primary, or an owned calendar ID |
| TOKEN_ENCRYPTION_KEY | Random 32-byte base64 AES-GCM key |
| ARCHIVE_ADMIN_TOKEN | Random server-only administration credential |
| RATE_LIMIT_SECRET | Secret used to HMAC email rate-limit buckets |
| GEMINI_API_KEY / GEMINI_MODEL | Optional server-only classification/drafting |
| SITE_URL | Canonical production frontend URL |
| ALLOWED_ORIGINS | Comma-separated exact production/local browser origins |

Hosted Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. `SUPABASE_SECRET_KEY` is an optional server-only fallback. Never put either privileged key in `VITE_` variables. See `supabase/functions/.env.example` for names only. Local secret values belong in the ignored owner-readable `supabase/functions/.env`, not an example file.

The public functions have `verify_jwt=false` because anonymous visitors do not have user JWTs. RLS blocks direct table access regardless of sign-in. Admin functions independently validate `ARCHIVE_ADMIN_TOKEN`; a publishable key is not administrator authorization. The OAuth GET endpoint independently validates one-use state and PKCE.

Payloads are limited to 16KB and fields have strict lengths/type/email/timezone checks. Only validated fields are inserted; client `status`, Google IDs, AI data and assignment fields are ignored. Text is stored as text, not rendered as HTML; Gmail uses plain-text MIME. Calendar descriptions escape HTML. CORS permits only exact configured origins. CORS is not authentication: nonbrowser abuse is constrained by atomic global and per-email rate limits and a hidden honeypot. Current limits are 60 submissions/minute globally and 5/hour per email across both public endpoints. Review these limits against traffic; if spam increases, add a verified challenge before relaxing limits.

## Frontend configuration

The only frontend settings are:

```dotenv
VITE_SUPABASE_URL=https://jurnsxyyahltltfrljls.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
```

A publishable key is optional for these deliberately public function endpoints. If supplied it must be an `sb_publishable_` key; the client never sends service-role credentials. The URL is baked into the production build. Configure it for every future Cloudflare/manual build. `.env.local` is ignored; `.env.example` contains no secret values.

Primary submission is `submit-inquiry`, not mailto. A stored inquiry returns `success: true` and an ID. The success UI only claims receipt by the archive; it does not claim an email was sent or a request approved. If no backend URL is configured, the form shows an honest error and preserves the manual `info@kenthephotographer.com` fallback.

## Deployment

```sh
supabase link --project-ref jurnsxyyahltltfrljls
supabase db push --linked
supabase secrets set --project-ref jurnsxyyahltltfrljls --env-file supabase/functions/.env
supabase functions deploy submit-inquiry create-booking update-booking google-oauth-callback gemini-assist --project-ref jurnsxyyahltltfrljls --use-api
npm ci
npm run build
```

For a fresh local stack, Docker must be running; use `supabase start` and `supabase db reset` only against local disposable data. Do not reset production. This migration is additive but contains personal-data tables: review backups before later schema changes.

Existing production uses Cloudflare direct upload, not automatic Git deployment. Publish the exact checked source commit using the existing `wrangler pages deploy dist --project-name ken-the-photographer --branch main --commit-hash COMMIT_SHA` process. Here `main` is the Cloudflare production environment label; Git remains on `codex/archive-commercial-upgrade`. No merge to Git main is needed.

## Verification

```sh
npm run build
npm test
npm run check:backend
npm run test:backend
supabase db query --linked --file supabase/tests/security.sql
supabase db advisors --linked --type security
```

The Deno tests mock Google/Gemini and exercise success, invalid/missing fields, integration failure independence, token refresh, request-only bookings, Calendar create/update/cancel, deterministic event IDs, server-admin rejection, CORS and ciphertext. SQL tests actually attempt denied access as `anon` and `authenticated`, then roll back. These checks do not prove real Google credentials work.

For operational review, inspect `inquiries.processing_status/processing_error`, `bookings.sync_error`, and `communications.delivery_status/error_code`. Optional service failures remain visible internally. Template notifications and Gemini drafts can be retried through the admin endpoint after setup. Keep administrative credentials out of public browser tools.

## Manual steps still required

Follow [Google Workspace setup](google-workspace-setup.md) to create OAuth credentials and consent as info@kenthephotographer.com. Follow [Gemini setup](gemini-setup.md) to enable the optional AI layer. Neither Google nor Gemini credentials are invented. Until configured, inquiry/booking storage still works; email delivery, Google events and Gemini generation are unavailable and recorded as such.
