import { db } from "./db.ts";
import { AppError, env, fetchJSON, required } from "./core.ts";
import { decrypt, encrypt } from "./crypto.ts";
export const workspaceEmail = () =>
  env("GOOGLE_WORKSPACE_EMAIL", "info@kenthephotographer.com");
export async function refreshGoogleToken(
  refreshToken: string,
  fetcher = fetchJSON,
) {
  const result = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  }, "GOOGLE_TOKEN_REFRESH_FAILED");
  if (
    typeof result.access_token !== "string" ||
    !Number.isFinite(result.expires_in)
  ) throw new AppError("GOOGLE_TOKEN_REFRESH_FAILED", 502);
  return result;
}
export async function getGoogleAccessToken(force = false) {
  const rows = await db.request(
    `google_oauth_tokens?account_email=eq.${
      encodeURIComponent(workspaceEmail())
    }&limit=1`,
  );
  const row = rows?.[0];
  if (!row?.refresh_token) throw new AppError("GOOGLE_NOT_CONNECTED", 503);
  if (
    !force && row.access_token &&
    Date.parse(row.expires_at) > Date.now() + 60000
  ) return await decrypt(row.access_token);
  const result = await refreshGoogleToken(await decrypt(row.refresh_token));
  const patch: Record<string, unknown> = {
    access_token: await encrypt(result.access_token),
    expires_at: new Date(Date.now() + result.expires_in * 1000).toISOString(),
  };
  if (result.refresh_token) {
    patch.refresh_token = await encrypt(result.refresh_token);
  }
  await db.save("google_oauth_tokens", row.id, patch);
  return result.access_token;
}
export async function googleRequest(url: string, init: RequestInit = {}) {
  let token = await getGoogleAccessToken();
  const send = () =>
    fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(12000),
    });
  let response = await send();
  if (response.status === 401) {
    token = await getGoogleAccessToken(true);
    response = await send();
  }
  return response;
}
