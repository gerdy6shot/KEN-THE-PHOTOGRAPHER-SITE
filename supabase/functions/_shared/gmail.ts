import { db } from "./db.ts";
import { AppError, errorCode } from "./core.ts";
import { googleRequest, workspaceEmail } from "./google-auth.ts";
const b64 = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)));
export function mimeMessage(
  to: string,
  subject: string,
  body: string,
  from: string,
  messageId: string,
) {
  if ([to, subject, from, messageId].some((s) => /[\r\n]/.test(s))) {
    throw new AppError("INVALID_EMAIL_HEADER", 400);
  }
  const mime = [
    `From: Kenneth Harris Archive <${from}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    `Message-ID: <${messageId}@kenthephotographer.com>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(body),
  ].join("\r\n");
  return b64(mime).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export async function deliver(message: Record<string, any>) {
  const saved = await db.request(
    "communications?on_conflict=dedupe_key",
    "POST",
    { ...message, from_email: workspaceEmail(), direction: "outbound" },
    "resolution=ignore-duplicates,return=representation",
  );
  let row = saved?.[0];
  if (!row) {
    row = (await db.request(
      `communications?dedupe_key=eq.${encodeURIComponent(message.dedupe_key)}`,
    ))[0];
  }
  if (row.delivery_status === "sent") return row;
  if (["sending", "uncertain"].includes(row.delivery_status)) {
    throw new AppError("EMAIL_REQUIRES_REVIEW", 502);
  }
  const claimed = await db.request(
    `communications?id=eq.${row.id}&delivery_status=in.(pending,failed)`,
    "PATCH",
    { delivery_status: "sending", error_code: null },
  );
  if (!claimed?.length) throw new AppError("EMAIL_IN_PROGRESS", 409);
  let sending = false;
  try {
    // Obtain credentials before entering the ambiguous send window.
    const { getGoogleAccessToken } = await import("./google-auth.ts");
    await getGoogleAccessToken();
    sending = true;
    const response = await googleRequest(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw: mimeMessage(
            message.to_email,
            message.subject,
            message.body,
            workspaceEmail(),
            row.id,
          ),
        }),
      },
    );
    if (!response.ok) {
      sending = false;
      throw new AppError("GMAIL_SEND_FAILED", 502);
    }
    const result = await response.json();
    if (!result.id) throw new AppError("GMAIL_INVALID_RESPONSE", 502);
    return await db.save("communications", row.id, {
      delivery_status: "sent",
      google_message_id: result.id,
      google_thread_id: result.threadId || null,
      sent_at: new Date().toISOString(),
    });
  } catch (e) {
    await db.save("communications", row.id, {
      delivery_status: sending ? "uncertain" : "failed",
      error_code: errorCode(e),
    });
    throw e;
  }
}
export function inquiryMessages(row: Record<string, any>) {
  return [
    {
      inquiry_id: row.id,
      dedupe_key: `inquiry:${row.id}:internal`,
      to_email: workspaceEmail(),
      subject: "NEW KENNETH HARRIS ARCHIVE INQUIRY",
      body:
        `NEW KENNETH HARRIS ARCHIVE INQUIRY\n\nName: ${row.name}\nEmail: ${row.email}\nOrganization: ${
          row.organization || "Not supplied"
        }\nInquiry type: ${row.inquiry_type}\nPhotograph: ${
          row.photograph_title || ""
        } ${
          row.photograph_id || ""
        }\nMessage:\n${row.message}\n\nInquiry ID: ${row.id}`,
    },
    {
      inquiry_id: row.id,
      dedupe_key: `inquiry:${row.id}:receipt`,
      to_email: row.email,
      subject: "Kenneth Harris Archive — Inquiry Received",
      body:
        `Hello ${row.name},\n\nThank you. Your inquiry has been received by the Kenneth Harris Archive. Our team will review it and follow up. This confirms receipt only; it does not approve a booking, license, print acquisition, exhibition, interview, or other request.\n\nReference: ${row.id}\n\nKenneth Harris Archive\ninfo@kenthephotographer.com`,
    },
  ];
}
export function bookingMessages(row: Record<string, any>, kind = "requested") {
  return [
    {
      booking_id: row.id,
      dedupe_key: `booking:${row.id}:${kind}:internal`,
      to_email: workspaceEmail(),
      subject: `Kenneth Harris Archive — Booking ${kind}`,
      body:
        `Booking ${kind}\nName: ${row.name}\nEmail: ${row.email}\nType: ${row.booking_type}\nStart: ${row.requested_start}\nEnd: ${row.requested_end}\nTimezone: ${row.timezone}\nNotes: ${
          row.notes || ""
        }\nBooking ID: ${row.id}`,
    },
    {
      booking_id: row.id,
      dedupe_key: `booking:${row.id}:${kind}:visitor`,
      to_email: row.email,
      subject: `Kenneth Harris Archive — Booking ${
        kind === "approved" ? "Confirmed" : "Request Received"
      }`,
      body: kind === "approved"
        ? `Hello ${row.name},\n\nYour booking has been approved by the archive team. Please refer to your Google Calendar invitation for the time and details.\n\nReference: ${row.id}\nKenneth Harris Archive`
        : `Hello ${row.name},\n\nYour booking request has been received. It is not yet approved or confirmed. The archive team will follow up after review.\n\nReference: ${row.id}\nKenneth Harris Archive`,
    },
  ];
}
