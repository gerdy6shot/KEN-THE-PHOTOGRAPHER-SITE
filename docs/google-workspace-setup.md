# Google Workspace setup

The website stays on Cloudflare Pages. Its browser calls Supabase Edge Functions; only those functions call Gmail, Calendar and Gemini. No ChatGPT/OpenAI service is part of the deployed architecture.

## Google administrator steps

1. Select or create a Google Cloud project under the organization that owns `info@kenthephotographer.com`.
2. Enable the **Gmail API** and **Google Calendar API** in APIs & Services.
3. Configure **Google Auth Platform** branding, audience and data access. For a Workspace-only application choose Internal when your organization supports it. If External/Testing is necessary, add `info@kenthephotographer.com` as a test user and review Google's refresh-token expiration and verification requirements before production.
4. Create an OAuth 2.0 **Web application** client. This is a server authorization-code flow, not browser Google sign-in.
5. Add this exact authorized redirect URI:

   `https://koyankycsshjsezaqdbm.supabase.co/functions/v1/google-oauth-callback`

6. In the ignored `supabase/functions/.env`, add the Google client ID and client secret. Preserve the existing encryption, administrator and rate-limit secrets. Never put Google credentials in `.env.local`, a `VITE_` variable, GitHub source, or Cloudflare frontend settings.
7. Upload the server values with:

   ```sh
   supabase secrets set --project-ref koyankycsshjsezaqdbm --env-file supabase/functions/.env
   ```

   Do not upload the example file with blank values over configured production secrets. Supabase already supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; do not overwrite these reserved values.

8. From a trusted terminal, load the server-only administrator token into your environment and call the OAuth start endpoint. Do not place the token in a URL or browser JavaScript:

   ```sh
   curl --fail-with-body -X POST \
     'https://koyankycsshjsezaqdbm.supabase.co/functions/v1/google-oauth-callback' \
     -H "Authorization: Bearer $ARCHIVE_ADMIN_TOKEN" \
     -H 'Content-Type: application/json' -d '{}'
   ```

9. Open the returned `authorization_url` and authorize **info@kenthephotographer.com**. A Google Workspace administrator may have to approve the OAuth app/API scopes. Codex cannot supply that administrator consent. The callback rejects any other account and unverified email identity.
10. The callback exchanges the code using PKCE, consumes a one-use ten-minute state, verifies the account and granted scopes, and stores encrypted refresh/access tokens. It returns a plain confirmation, never tokens. Do not manually copy tokens to the website.
11. Set `GOOGLE_CALENDAR_ID=primary` for the account's primary calendar, or the ID of another calendar **owned by this account**. Verify its IANA timezone and working hours. Events use the submitted explicit timezone and offset timestamps. Free slots are checked against Calendar events, including recurring events. An administrator must still review business hours and booking suitability.
12. Make one controlled inquiry with an address you own, verify both Gmail messages and the `communications` rows, then approve/update/cancel one test booking and check its invitations. Automated tests use mocks and do not establish that Google APIs are authorized.

## Exact scopes

- `openid` and `email`: verify that the authorized account is the intended Workspace account.
- `https://www.googleapis.com/auth/gmail.send`: send only; no inbox reading or mailbox modification.
- `https://www.googleapis.com/auth/calendar.events.owned`: read/create/update/delete events on calendars the account owns. No Calendar ACL or whole-account scope is requested. Availability is determined with `events.list`, so a separate free/busy scope is unnecessary.

If you choose a shared calendar not owned by this account, this implementation deliberately does not request expanded scopes automatically. Use an owned calendar or review the required permission change first.

## Credential protection

The server-only `google_oauth_tokens` columns contain AES-256-GCM ciphertext. `TOKEN_ENCRYPTION_KEY` is a random 32-byte base64 key stored in Supabase Edge Function secrets; it never reaches the browser/database in plaintext. `archive_oauth_states.verifier` is encrypted too. All token/state tables have RLS enabled, no public policies and revoked `anon`/`authenticated` grants. This uses a protected server-secret encryption mechanism rather than introducing Vault security-definer wrappers into the public API.

Back up the key in your organization's secret manager. Replacing it without re-encrypting records makes stored tokens unreadable; reconnect Google after intentional rotation. The ignored local secret file has owner-only permissions. Refresh tokens are sent only to Google's official token endpoint. Error logs contain codes and record IDs, not token values or upstream response bodies. Revoking Google consent requires reconnecting the account.

## Booking administration

There is no booking-date form in the existing site, so no new visual section was invented. The new `create-booking` API accepts requests for a future interface. Existing exhibition/interview CTAs remain inquiries.

Public POST `/functions/v1/create-booking` takes `name`, `email`, optional `phone`/`organization`, `booking_type`, offset-bearing `requested_start`/`requested_end`, IANA `timezone`, optional `notes`, and a UUID `idempotency_key`. It always stores `requested`; public input cannot approve a booking.

Trusted administrators POST `/functions/v1/update-booking` with `Authorization: Bearer $ARCHIVE_ADMIN_TOKEN`:

```json
{"booking_id":"UUID", "action":"approve"}
```

Actions: `approve`, `update`, `cancel`, `decline`, `complete`. `update` accepts new start/end/timezone/notes. An approval is saved only after Google event creation succeeds. Calendar modifications use `sendUpdates=all`; the requester is an attendee. The stored event ID is reused. A deterministic event ID recovers creation after a network/database failure without duplicating events. A database lease serializes archive Calendar operations for five minutes; concurrent requests return a retryable 409. This does not lock out humans editing Google Calendar directly, so admin review remains necessary.

If sync fails, the booking request and `sync_error` remain. Resolve the integration problem and retry; never manually mark a failed request approved. A cancelled event is not silently re-created. Declining an untouched request does not require Google access.

## Email delivery and recovery

Inquiry and booking records are committed before optional integrations run. `communications` is a durable delivery ledger with pending/sending/sent/failed/uncertain states and unique message keys. Gmail IDs are saved after success. Internal inquiry notifications and visitor receipt templates are independent of Gemini; no Gemini text is ever sent automatically.

After Google authorization, retry incomplete inquiry processing with an administrator POST to `submit-inquiry`:

```json
{"action":"retry-processing","inquiry_id":"UUID"}
```

Already-sent messages are skipped. `failed` messages can retry. `sending` or `uncertain` entries require a human to check Gmail's Sent folder before resetting the state; Gmail's send API provides no transactional exactly-once guarantee. A successful send followed by a lost response must not produce automatic duplicate emails. The MIME `Message-ID` is stable for reconciliation. The admin can mark a confirmed sent row `sent` with its Google ID, or mark a verified unsent row `failed` before retrying. These actions belong in the Supabase dashboard/trusted server, never a public client.

Booking event invitations are sent by Calendar; approved-booking Gmail confirmations are additionally logged. Failed booking emails remain in the ledger for administrator review. Do not approve again simply to resend mail.

Official references: [OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [Gmail sending](https://developers.google.com/workspace/gmail/api/guides/sending), [Calendar events](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert).
