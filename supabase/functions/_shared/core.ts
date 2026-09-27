export class AppError extends Error {
  constructor(public code: string, public status = 500) {
    super(code);
  }
}
export const env = (name: string, fallback = "") =>
  Deno.env.get(name) || fallback;
export function required(name: string) {
  const v = env(name);
  if (!v) throw new AppError("SERVER_NOT_CONFIGURED", 503);
  return v;
}
export const json = (value: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
export const errorCode = (e: unknown) =>
  e instanceof AppError ? e.code : "INTERNAL_ERROR";
export async function sha256(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_")
    .replace(/=+$/, "");
export async function admin(req: Request) {
  const expected = required("ARCHIVE_ADMIN_TOKEN");
  const supplied = req.headers.get("authorization")?.replace(/^Bearer /, "") ||
    "";
  const a = await sha256(supplied), b = await sha256(expected);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  if (diff) throw new AppError("UNAUTHORIZED", 401);
}
export async function body(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    throw new AppError("JSON_REQUIRED", 415);
  }
  const reader = req.body?.getReader();
  if (!reader) throw new AppError("INVALID_BODY", 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 16000) {
      await reader.cancel();
      throw new AppError("BODY_TOO_LARGE", 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  try {
    const v = JSON.parse(new TextDecoder().decode(bytes));
    if (!v || typeof v !== "object" || Array.isArray(v)) throw 0;
    return v;
  } catch {
    throw new AppError("INVALID_JSON", 400);
  }
}
export function endpoint(
  handler: (req: Request) => Promise<Response>,
  callback = false,
) {
  return async (req: Request) => {
    const origin = req.headers.get("origin");
    const allowed = env("ALLOWED_ORIGINS").split(",").map((s) => s.trim())
      .filter(Boolean);
    const headers: Record<string, string> = {
      "Vary": "Origin",
      "Access-Control-Allow-Headers": "content-type, apikey, authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
    if (origin && !allowed.includes(origin)) {
      return json({ success: false, error: "ORIGIN_NOT_ALLOWED" }, 403);
    }
    if (origin) headers["Access-Control-Allow-Origin"] = origin;
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (req.method !== "POST" && !(callback && req.method === "GET")) {
      return json(
        { success: false, error: "METHOD_NOT_ALLOWED" },
        405,
        headers,
      );
    }
    try {
      const r = await handler(req);
      for (const [k, v] of Object.entries(headers)) r.headers.set(k, v);
      return r;
    } catch (e) {
      const code = errorCode(e);
      console.error(JSON.stringify({ code }));
      return json(
        { success: false, error: code },
        e instanceof AppError ? e.status : 500,
        headers,
      );
    }
  };
}
export async function fetchJSON(
  url: string,
  init: RequestInit = {},
  code = "UPSTREAM_UNAVAILABLE",
) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) })
    .catch(() => {
      throw new AppError(code, 502);
    });
  if (!r.ok) throw new AppError(code, r.status === 409 ? 409 : 502);
  if (r.status === 204) return {};
  return await r.json();
}
