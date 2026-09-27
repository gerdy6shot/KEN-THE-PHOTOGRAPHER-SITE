import { AppError, env, required } from "./core.ts";
export class Database {
  async request(
    path: string,
    method = "GET",
    value?: unknown,
    prefer = "return=representation",
  ): Promise<any> {
    const key = env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SECRET_KEY");
    if (!key) throw new AppError("SERVER_NOT_CONFIGURED", 503);
    const response = await fetch(
      `${required("SUPABASE_URL")}/rest/v1/${path}`,
      {
        method,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: prefer,
        },
        body: value === undefined ? undefined : JSON.stringify(value),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) {
      throw new AppError(
        response.status === 409 ? "RECORD_CONFLICT" : "DATABASE_UNAVAILABLE",
        response.status === 409 ? 409 : 503,
      );
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  async one(table: string, id: string) {
    const rows = await this.request(
      `${table}?id=eq.${encodeURIComponent(id)}&limit=1`,
    );
    if (!rows?.[0]) throw new AppError("NOT_FOUND", 404);
    return rows[0];
  }
  async save(table: string, id: string, patch: unknown) {
    const rows = await this.request(
      `${table}?id=eq.${encodeURIComponent(id)}`,
      "PATCH",
      patch,
    );
    if (!rows?.[0]) throw new AppError("NOT_FOUND", 404);
    return rows[0];
  }
  async insert(table: string, row: unknown) {
    return (await this.request(table, "POST", row))[0];
  }
  async rpc(name: string, args: unknown) {
    return await this.request(`rpc/${name}`, "POST", args);
  }
  async once(table: string, row: Record<string, unknown>) {
    const rows = await this.request(
      `${table}?on_conflict=idempotency_key`,
      "POST",
      row,
      "resolution=ignore-duplicates,return=representation",
    );
    if (rows?.[0]) return { row: rows[0], fresh: true };
    const old = (await this.request(
      `${table}?idempotency_key=eq.${row.idempotency_key}&limit=1`,
    ))[0];
    if (!old || old.payload_hash !== row.payload_hash) {
      throw new AppError("IDEMPOTENCY_CONFLICT", 409);
    }
    return { row: old, fresh: false };
  }
}
export const db = new Database();
