import {
  admin,
  AppError,
  base64url,
  endpoint,
  fetchJSON,
  json,
  required,
  sha256,
} from "../_shared/core.ts";
import { db } from "../_shared/db.ts";
import { decrypt, encrypt } from "../_shared/crypto.ts";
import { workspaceEmail } from "../_shared/google-auth.ts";
const scopes = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.events.owned",
];
Deno.serve(endpoint(async (req) => {
  if (req.method === "POST") {
    await admin(req);
    const state = base64url(crypto.getRandomValues(new Uint8Array(32))),
      verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
    const challenge = base64url(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(verifier),
        ),
      ),
    );
    await db.request(
      `archive_oauth_states?expires_at=lt.${
        encodeURIComponent(new Date().toISOString())
      }`,
      "DELETE",
    );
    await db.insert("archive_oauth_states", {
      state_hash: await sha256(state),
      verifier: await encrypt(verifier),
      expires_at: new Date(Date.now() + 600000).toISOString(),
    });
    const query = new URLSearchParams({
      client_id: required("GOOGLE_CLIENT_ID"),
      redirect_uri: required("GOOGLE_REDIRECT_URI"),
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      login_hint: workspaceEmail(),
    });
    return json({
      authorization_url:
        `https://accounts.google.com/o/oauth2/v2/auth?${query}`,
    });
  }
  const url = new URL(req.url),
    state = url.searchParams.get("state"),
    code = url.searchParams.get("code");
  if (!state || !code || state.length > 200 || code.length > 4000) {
    throw new AppError("INVALID_OAUTH_CALLBACK", 400);
  }
  const claimed = await db.request(
    `archive_oauth_states?state_hash=eq.${await sha256(state)}&expires_at=gt.${
      encodeURIComponent(new Date().toISOString())
    }`,
    "DELETE",
  );
  if (!claimed?.[0]) throw new AppError("OAUTH_STATE_EXPIRED_OR_USED", 400);
  const token = await fetchJSON("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      redirect_uri: required("GOOGLE_REDIRECT_URI"),
      code,
      code_verifier: await decrypt(claimed[0].verifier),
      grant_type: "authorization_code",
    }),
  }, "GOOGLE_OAUTH_EXCHANGE_FAILED");
  const identity = await fetchJSON(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${token.access_token}` } },
    "GOOGLE_IDENTITY_FAILED",
  );
  if (
    identity.email?.toLowerCase() !== workspaceEmail().toLowerCase() ||
    identity.email_verified !== true
  ) throw new AppError("WRONG_GOOGLE_ACCOUNT", 403);
  for (const scope of scopes.filter((s) => s.startsWith("https://"))) {
    if (!String(token.scope || "").split(" ").includes(scope)) {
      throw new AppError("MISSING_GOOGLE_SCOPE", 400);
    }
  }
  const old = (await db.request(
    `google_oauth_tokens?account_email=eq.${
      encodeURIComponent(workspaceEmail())
    }`,
  ))[0];
  const refresh = token.refresh_token
    ? await encrypt(token.refresh_token)
    : old?.refresh_token;
  if (!refresh) throw new AppError("GOOGLE_REFRESH_TOKEN_MISSING", 400);
  await db.request("google_oauth_tokens?on_conflict=account_email", "POST", {
    account_email: workspaceEmail(),
    refresh_token: refresh,
    access_token: await encrypt(token.access_token),
    expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    scope: token.scope,
  }, "resolution=merge-duplicates,return=minimal");
  return new Response(
    "Google Workspace connected securely. You may close this window.",
    {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}, true));
