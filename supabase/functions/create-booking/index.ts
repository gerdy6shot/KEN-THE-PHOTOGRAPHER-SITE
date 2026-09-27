import { body, endpoint, json } from "../_shared/core.ts";
import { booking } from "../_shared/validation.ts";
import { rateLimit, submitRecord } from "../_shared/workflows.ts";
Deno.serve(endpoint(async (req) => {
  const data = booking(await body(req));
  await rateLimit(data.email);
  return json(await submitRecord("bookings", data));
}));
