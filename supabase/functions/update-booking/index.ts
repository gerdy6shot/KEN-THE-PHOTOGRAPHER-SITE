import {
  admin,
  AppError,
  body,
  endpoint,
  env,
  errorCode,
  json,
} from "../_shared/core.ts";
import { booking, uuid } from "../_shared/validation.ts";
import { db } from "../_shared/db.ts";
import { Calendar } from "../_shared/calendar.ts";
import { bookingMessages, deliver } from "../_shared/gmail.ts";
Deno.serve(endpoint(async (req) => {
  await admin(req);
  const input = await body(req);
  const id = uuid(input.booking_id), action = input.action;
  if (
    !["approve", "update", "cancel", "decline", "complete"].includes(
      String(action),
    )
  ) throw new AppError("INVALID_ACTION", 400);
  let row = await db.one("bookings", id);
  const lockKey = `calendar:${
      row.google_calendar_id || env("GOOGLE_CALENDAR_ID", "primary")
    }`,
    owner = crypto.randomUUID();
  if (!await db.rpc("archive_claim_lock", { p_key: lockKey, p_owner: owner })) {
    throw new AppError("CALENDAR_BUSY_RETRY", 409);
  }
  try {
    row = await db.one("bookings", id);
    const calendar = new Calendar();
    if (action === "approve") {
      if (row.status === "approved") {
        return json({ success: true, booking_id: id, status: row.status });
      }
      if (!["requested", "pending"].includes(row.status)) {
        throw new AppError("INVALID_STATUS_TRANSITION", 409);
      }
      const event = await calendar.create(row);
      row = await db.save("bookings", id, {
        status: "approved",
        google_event_id: event.id,
        google_calendar_id: event.calendar,
        google_html_link: event.htmlLink || null,
        sync_error: null,
      });
      const results = await Promise.allSettled(
        bookingMessages(row, "approved").map(deliver),
      );
      return json({
        success: true,
        booking_id: id,
        status: row.status,
        email_pending: results.some((r) => r.status === "rejected"),
      });
    }
    if (action === "update") {
      if (row.status !== "approved") {
        throw new AppError("INVALID_STATUS_TRANSITION", 409);
      }
      const details = booking({
        ...row,
        requested_start: input.requested_start ?? row.requested_start,
        requested_end: input.requested_end ?? row.requested_end,
        timezone: input.timezone ?? row.timezone,
        notes: input.notes ?? row.notes,
      });
      const event = await calendar.update({ ...row, ...details });
      await db.save("bookings", id, {
        requested_start: details.requested_start,
        requested_end: details.requested_end,
        timezone: details.timezone,
        notes: details.notes,
        google_html_link: event.htmlLink || row.google_html_link,
        sync_error: null,
      });
    }
    if (action === "cancel" || action === "decline") {
      if (
        row.status === "completed" ||
        (action === "decline" &&
          !["requested", "pending", "declined"].includes(row.status))
      ) throw new AppError("INVALID_STATUS_TRANSITION", 409);
      // Deterministic ID also recovers an event created before a failed database write.
      if (row.google_event_id || row.status === "approved" || row.sync_error) {
        await calendar.cancel(row);
      }
      await db.save("bookings", id, {
        status: action === "cancel" ? "cancelled" : "declined",
        sync_error: null,
      });
    }
    if (action === "complete") {
      if (row.status !== "approved") {
        throw new AppError("INVALID_STATUS_TRANSITION", 409);
      }
      await db.save("bookings", id, { status: "completed" });
    }
    return json({ success: true, booking_id: id });
  } catch (e) {
    await db.save("bookings", id, { sync_error: errorCode(e) });
    throw e;
  } finally {
    await db.request(
      `archive_backend_locks?lock_key=eq.${
        encodeURIComponent(lockKey)
      }&owner=eq.${owner}`,
      "DELETE",
    );
  }
}));
