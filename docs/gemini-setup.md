# Gemini setup

Gemini is the only AI service in this architecture. Supabase Edge Functions call the official Google Gemini REST `generateContent` API. No third-party AI SDK or OpenAI dependency is bundled into the website.

1. In [Google AI Studio](https://aistudio.google.com/apikey), create a Gemini API key for the intended Google Cloud project. Review your Google billing, quotas and applicable data-processing terms for inquiry content.
2. Choose a currently available Gemini model that supports structured JSON output in your project. Set its exact ID in `GEMINI_MODEL`; there is intentionally no hard-coded model that may be unavailable to your account.
3. Add `GEMINI_API_KEY` and `GEMINI_MODEL` to the ignored server file `supabase/functions/.env`, then run:

   ```sh
   supabase secrets set --project-ref koyankycsshjsezaqdbm --env-file supabase/functions/.env
   ```

4. Never put this key in `VITE_` variables, Cloudflare frontend settings, `site-config.js`, Git or client JavaScript.
5. Validate with a controlled test request and inspect the `gemini_*` columns in the Supabase dashboard. `gemini-assist` can reprocess a saved inquiry/booking via an administrator-authorized POST:

   ```json
   {"kind":"inquiry","id":"UUID"}
   ```

   Use `kind: "booking"` for a booking. The administrator token is server-only.

The schema allows only the documented categories and priorities, bounds summary/draft lengths, and rejects invalid responses. Request messages are treated as untrusted input. Explicit evidence is required for elevated priority. Gemini receives the message/notes, request type, photograph title and requested start when relevant; it does not receive OAuth tokens or database credentials.

Gemini produces classification, internal summaries and **draft replies only**. Drafts must be reviewed for factual accuracy, pricing/rights/availability promises and prompt injection. They are never sent by this implementation. There is no AI-triggered booking approval/cancellation or substantive email action. Automatic receipt messages are fixed templates.

Missing credentials, model errors, timeouts and invalid AI output do not undo a saved request or prevent the Gmail notification attempts. Configure Gemini after the core inquiry pipeline is working. You can leave it disabled indefinitely.

References: [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key), [structured output](https://ai.google.dev/gemini-api/docs/structured-output).
