// deno-lint-ignore-file require-await -- mocks intentionally implement asynchronous API contracts
import { admin, AppError, endpoint } from "../functions/_shared/core.ts";
import { booking, inquiry } from "../functions/_shared/validation.ts";
import { validateGemini } from "../functions/_shared/gemini.ts";
import { refreshGoogleToken } from "../functions/_shared/google-auth.ts";
import { submitRecord } from "../functions/_shared/workflows.ts";
import { Calendar, eventId } from "../functions/_shared/calendar.ts";
import { mimeMessage } from "../functions/_shared/gmail.ts";
import { decrypt, encrypt } from "../functions/_shared/crypto.ts";
function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}
async function rejects(fn: () => unknown | Promise<unknown>, code?: string) {
  try {
    await fn();
  } catch (e) {
    if (code) assert(e instanceof AppError && e.code === code);
    return;
  }
  throw new Error("Expected rejection");
}
const id = "123e4567-e89b-42d3-a456-426614174000";
const valid = {
  name: "Test Visitor",
  email: "visitor@example.com",
  inquiry_type: "Fine art print",
  message: "Test inquiry",
  photograph_id: "KTP-EARLY-006",
  photograph_title: "Nina Simone",
  idempotency_key: id,
};
const bookingInput = {
  name: "Test Visitor",
  email: "visitor@example.com",
  booking_type: "Interview",
  requested_start: "2030-01-02T10:00:00-05:00",
  requested_end: "2030-01-02T11:00:00-05:00",
  timezone: "America/New_York",
  notes: "Test request",
  idempotency_key: id,
};
const ai = {
  category: "general",
  summary: "Summary",
  priority: "normal",
  draft_reply: "Draft for review",
};
function fakeDependencies(aiFails = false, mailFails = false) {
  const saved: any[] = [];
  const mails: any[] = [];
  let existing: any;
  return {
    saved,
    mails,
    db: {
      once: (_t: string, row: any) => {
        const fresh = !existing;
        existing ||= { ...row, id };
        return Promise.resolve({ row: existing, fresh });
      },
      save: (table: string, key: string, patch: any) => {
        saved.push({ table, key, patch });
        return Promise.resolve(patch);
      },
    },
    assist: () =>
      aiFails
        ? Promise.reject(new AppError("GEMINI_UNAVAILABLE"))
        : Promise.resolve(ai),
    deliver: (m: any) => {
      mails.push(m);
      return mailFails
        ? Promise.reject(new AppError("GMAIL_SEND_FAILED"))
        : Promise.resolve({
          google_message_id: "message",
          google_thread_id: "thread",
        });
    },
  };
}
Deno.test("valid inquiry stores fields and sends two template messages", async () => {
  const d = fakeDependencies();
  const result = await submitRecord("inquiries", inquiry(valid), d as any);
  assert(result.success && result.inquiry_id === id);
  assert(d.mails.length === 2);
  assert(d.mails[0].body.includes("KTP-EARLY-006"));
  assert(d.mails[1].body.includes("does not approve"));
});
Deno.test("invalid email, header injection, missing fields, honeypot rejected", async () => {
  await rejects(
    () => inquiry({ ...valid, email: "not-email" }),
    "INVALID_EMAIL",
  );
  await rejects(
    () => inquiry({ ...valid, email: "a@b.com\r\nBcc: x@y.com" }),
    "INVALID_EMAIL",
  );
  await rejects(() => inquiry({ ...valid, name: "" }), "MISSING_FIELDS");
  await rejects(
    () => inquiry({ ...valid, website: "spam" }),
    "INVALID_SUBMISSION",
  );
  await rejects(
    () =>
      mimeMessage(
        "x@y.com",
        "x\r\nBcc:evil",
        "body",
        "info@kenthephotographer.com",
        "id",
      ),
    "INVALID_EMAIL_HEADER",
  );
});
Deno.test("Gemini unavailable does not block inquiry or Gmail", async () => {
  const d = fakeDependencies(true);
  const r = await submitRecord("inquiries", inquiry(valid), d as any);
  assert(r.success && d.mails.length === 2);
  assert(d.saved.some((s) => s.patch.processing_status === "partial"));
});
Deno.test("Gmail unavailable preserves inquiry and AI result", async () => {
  const d = fakeDependencies(false, true);
  const r = await submitRecord("inquiries", inquiry(valid), d as any);
  assert(r.success);
  assert(d.saved.some((s) => s.patch.gemini_summary));
  assert(
    d.saved.some((s) =>
      s.patch.processing_error?.includes("GMAIL_SEND_FAILED")
    ),
  );
});
Deno.test("idempotent retry does not repeat email or AI", async () => {
  const d = fakeDependencies();
  await submitRecord("inquiries", inquiry(valid), d as any);
  await submitRecord("inquiries", inquiry(valid), d as any);
  assert(d.mails.length === 2);
});
Deno.test("booking is requested, never auto approved", async () => {
  const d = fakeDependencies();
  const r = await submitRecord("bookings", booking(bookingInput), d as any);
  assert(r.success && r.status === "requested");
  assert(d.mails[1].body.includes("not yet approved"));
});
Deno.test("invalid booking range and timezone rejected", async () => {
  await rejects(
    () =>
      booking({ ...bookingInput, requested_end: bookingInput.requested_start }),
    "INVALID_BOOKING_TIME",
  );
  await rejects(
    () => booking({ ...bookingInput, timezone: "Not/AZone" }),
    "INVALID_TIMEZONE",
  );
});
Deno.test("Google token refresh uses server credentials", async () => {
  Deno.env.set("GOOGLE_CLIENT_ID", "test-client");
  Deno.env.set("GOOGLE_CLIENT_SECRET", "test-secret");
  const token = await refreshGoogleToken("test-refresh", async (url, init) => {
    assert(url === "https://oauth2.googleapis.com/token");
    const p = init!.body as URLSearchParams;
    assert(
      p.get("refresh_token") === "test-refresh" &&
        p.get("grant_type") === "refresh_token",
    );
    return { access_token: "fresh-test-token", expires_in: 3600 };
  });
  assert(token.access_token === "fresh-test-token");
});
Deno.test("invalid Gemini output is not stored", async () => {
  await rejects(
    () => validateGemini({ ...ai, priority: "emergency" }),
    "GEMINI_INVALID_OUTPUT",
  );
});
Deno.test("private endpoints reject public credentials", async () => {
  Deno.env.set("ARCHIVE_ADMIN_TOKEN", "server-test-secret");
  await rejects(
    () => admin(new Request("https://example.com")),
    "UNAUTHORIZED",
  );
  await rejects(
    () =>
      admin(
        new Request("https://example.com", {
          headers: { Authorization: "Bearer sb_publishable_test" },
        }),
      ),
    "UNAUTHORIZED",
  );
});
Deno.test("CORS rejects unapproved origins", async () => {
  Deno.env.set("ALLOWED_ORIGINS", "https://ken-the-photographer.pages.dev");
  const r = await endpoint(async () => new Response("ok"))(
    new Request("https://api.example.com", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    }),
  );
  assert(r.status === 403);
});
Deno.test("OAuth tokens roundtrip as ciphertext", async () => {
  Deno.env.set(
    "TOKEN_ENCRYPTION_KEY",
    btoa("12345678901234567890123456789012"),
  );
  const secret = "fake-refresh-token", cipher = await encrypt(secret);
  assert(!cipher.includes(secret));
  assert(await decrypt(cipher) === secret);
});
const book = { ...booking(bookingInput), id };
Deno.test("Calendar creation invites attendee with stable event ID", async () => {
  let event: any;
  const calendar = new Calendar(async (url, init) => {
    if (init?.method === "POST") {
      assert(url.includes("sendUpdates=all"));
      event = JSON.parse(init.body as string);
      return Response.json({
        ...event,
        htmlLink: "https://calendar.google.com/event",
      });
    }
    return url.includes("?")
      ? Response.json({ items: [] })
      : new Response(null, { status: 404 });
  });
  const result = await calendar.create(book);
  assert(event.attendees[0].email === book.email);
  assert(result.id === eventId(id));
});
Deno.test("Calendar retry does not create duplicate event", async () => {
  let writes = 0;
  const calendar = new Calendar(async (_url, init) => {
    if (init?.method === "POST") writes++;
    return Response.json({
      id: eventId(id),
      extendedProperties: { private: { archive_booking_id: id } },
    });
  });
  await calendar.create(book);
  await calendar.create(book);
  assert(writes === 0);
});
Deno.test("Calendar update uses stored event ID and invitations", async () => {
  let patched = false;
  const calendar = new Calendar(async (url, init) => {
    if (init?.method === "PATCH") {
      assert(url.includes("/stored-event?sendUpdates=all"));
      patched = true;
      return Response.json({ id: "stored-event" });
    }
    return Response.json(
      url.includes("?")
        ? { items: [{ id: "stored-event" }] }
        : { id: "stored-event" },
    );
  });
  await calendar.update({
    ...book,
    google_event_id: "stored-event",
    google_calendar_id: "primary",
  });
  assert(patched);
});
Deno.test("Calendar cancellation deletes stored ID; repeat 404 is harmless", async () => {
  let deletes = 0;
  const calendar = new Calendar(async (url, init) => {
    if (init?.method === "DELETE") {
      assert(url.includes("/stored-event?sendUpdates=all"));
      deletes++;
      return new Response(null, { status: 204 });
    }
    return deletes ? new Response(null, { status: 404 }) : Response.json({
      extendedProperties: { private: { archive_booking_id: id } },
    });
  });
  const row = {
    ...book,
    google_event_id: "stored-event",
    google_calendar_id: "primary",
  };
  await calendar.cancel(row);
  await calendar.cancel(row);
  assert(deletes === 1);
});
Deno.test("Calendar unavailable reports error instead of approval", async () => {
  const calendar = new Calendar(async () =>
    new Response(null, { status: 503 })
  );
  await rejects(() => calendar.create(book), "CALENDAR_READ_FAILED");
});
Deno.test("Calendar busy slot prevents event insertion", async () => {
  const calendar = new Calendar(async (url) =>
    url.includes("?")
      ? Response.json({ items: [{ id: "busy" }] })
      : new Response(null, { status: 404 })
  );
  await rejects(() => calendar.create(book), "CALENDAR_SLOT_UNAVAILABLE");
});
