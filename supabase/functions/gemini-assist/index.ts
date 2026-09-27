import { admin, AppError, body, endpoint, json } from "../_shared/core.ts";
import { uuid } from "../_shared/validation.ts";
import { db } from "../_shared/db.ts";
import { assist } from "../_shared/gemini.ts";
Deno.serve(endpoint(async (req) => {
  await admin(req);
  const input = await body(req);
  if (!["inquiry", "booking"].includes(String(input.kind))) {
    throw new AppError("INVALID_KIND", 400);
  }
  const table = input.kind === "booking" ? "bookings" : "inquiries",
    id = uuid(input.id),
    row = await db.one(table, id),
    result = await assist(row);
  await db.save(table, id, {
    gemini_summary: result.summary,
    gemini_draft_reply: result.draft_reply,
    ...(table === "inquiries"
      ? { gemini_category: result.category, gemini_priority: result.priority }
      : {}),
  });
  return json({ success: true, draft_only: true, result });
}));
