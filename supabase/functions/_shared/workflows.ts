import { db } from "./db.ts";
import { assist } from "./gemini.ts";
import { bookingMessages, deliver, inquiryMessages } from "./gmail.ts";
import { AppError, errorCode, required, sha256 } from "./core.ts";
export async function rateLimit(email: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(required("RATE_LIMIT_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = Array.from(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  const global = await db.rpc("archive_take_rate_limit", {
    p_bucket: "public-submissions",
    p_limit: 60,
    p_seconds: 60,
  });
  if (!global) throw new AppError("RATE_LIMITED", 429);
  const visitor = await db.rpc("archive_take_rate_limit", {
    p_bucket: `email:${digest}`,
    p_limit: 5,
    p_seconds: 3600,
  });
  if (!visitor) throw new AppError("RATE_LIMITED", 429);
}
export const dependencies = { db, assist, deliver };
export async function processRecord(
  kind: "inquiries" | "bookings",
  row: Record<string, any>,
  deps = dependencies,
) {
  const errors: string[] = [];
  // Gemini and mail are independent. An AI failure never prevents the notifications.
  const ai = async () => {
    try {
      const result = await deps.assist(row);
      await deps.db.save(
        kind,
        row.id,
        kind === "inquiries"
          ? {
            gemini_category: result.category,
            gemini_priority: result.priority,
            gemini_summary: result.summary,
            gemini_draft_reply: result.draft_reply,
          }
          : {
            gemini_summary: result.summary,
            gemini_draft_reply: result.draft_reply,
          },
      );
    } catch (e) {
      errors.push(errorCode(e));
    }
  };
  const messages = kind === "inquiries"
    ? inquiryMessages(row)
    : bookingMessages(row);
  await Promise.all([
    ai(),
    ...messages.map(async (message) => {
      try {
        const sent = await deps.deliver(message);
        if (kind === "inquiries" && message.dedupe_key.endsWith(":internal")) {
          await deps.db.save(kind, row.id, {
            google_message_id: sent.google_message_id,
            google_thread_id: sent.google_thread_id,
          });
        }
      } catch (e) {
        errors.push(errorCode(e));
      }
    }),
  ]);
  if (kind === "inquiries") {
    await deps.db.save(kind, row.id, {
      processing_status: errors.length ? "partial" : "complete",
      processing_error: errors.join(",") || null,
    });
  }
  return errors;
}
export async function submitRecord(
  kind: "inquiries" | "bookings",
  data: Record<string, unknown>,
  deps = dependencies,
) {
  const { row, fresh } = await deps.db.once(kind, {
    ...data,
    payload_hash: await sha256(JSON.stringify(data)),
    status: kind === "bookings" ? "requested" : "new",
  });
  if (fresh) {
    try {
      await processRecord(kind, row, deps);
    } catch (e) {
      console.error(JSON.stringify({ code: errorCode(e), record_id: row.id }));
    }
  }
  return kind === "inquiries"
    ? { success: true, inquiry_id: row.id }
    : { success: true, booking_id: row.id, status: row.status };
}
