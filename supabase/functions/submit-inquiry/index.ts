import { admin, body, endpoint, json } from "../_shared/core.ts";
import { inquiry, uuid } from "../_shared/validation.ts";
import {
  processRecord,
  rateLimit,
  submitRecord,
} from "../_shared/workflows.ts";
import { db } from "../_shared/db.ts";
Deno.serve(endpoint(async (req) => {
  const input = await body(req);
  if (input.action === "retry-processing") {
    await admin(req);
    const row = await db.one("inquiries", uuid(input.inquiry_id));
    const warnings = await processRecord("inquiries", row);
    return json({ success: true, inquiry_id: row.id, warnings });
  }
  const data = inquiry(input);
  await rateLimit(data.email);
  return json(await submitRecord("inquiries", data));
}));
