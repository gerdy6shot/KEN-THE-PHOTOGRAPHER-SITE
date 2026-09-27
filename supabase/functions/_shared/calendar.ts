import { AppError, env } from "./core.ts";
import { googleRequest } from "./google-auth.ts";
export const eventId = (id: string) =>
  `ktp${id.replaceAll("-", "").toLowerCase()}`;
const root = (calendar: string) =>
  `https://www.googleapis.com/calendar/v3/calendars/${
    encodeURIComponent(calendar)
  }/events`;
export class Calendar {
  constructor(private request = googleRequest) {}
  async get(calendar: string, id: string) {
    const r = await this.request(`${root(calendar)}/${id}`);
    if (r.status === 404 || r.status === 410) return null;
    if (!r.ok) throw new AppError("CALENDAR_READ_FAILED", 502);
    return await r.json();
  }
  async available(calendar: string, row: Record<string, any>, ignore?: string) {
    let next = "";
    do {
      const params = new URLSearchParams({
        timeMin: row.requested_start,
        timeMax: row.requested_end,
        singleEvents: "true",
        maxResults: "250",
        ...(next ? { pageToken: next } : {}),
      });
      const r = await this.request(`${root(calendar)}?${params}`);
      if (!r.ok) throw new AppError("CALENDAR_AVAILABILITY_FAILED", 502);
      const data = await r.json();
      if (
        (data.items || []).some((e: any) =>
          e.id !== ignore && e.status !== "cancelled" &&
          e.transparency !== "transparent"
        )
      ) throw new AppError("CALENDAR_SLOT_UNAVAILABLE", 409);
      next = data.nextPageToken || "";
    } while (next);
  }
  payload(row: Record<string, any>) {
    const plain = (s: unknown) =>
      String(s || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    return {
      summary: `Kenneth Harris Archive — ${row.booking_type} — ${row.name}`,
      description: `Requester: ${plain(row.name)}\nEmail: ${
        plain(row.email)
      }\nBooking type: ${plain(row.booking_type)}\nTimezone: ${
        plain(row.timezone)
      }\nNotes: ${plain(row.notes)}\nBooking ID: ${row.id}`,
      start: { dateTime: row.requested_start, timeZone: row.timezone },
      end: { dateTime: row.requested_end, timeZone: row.timezone },
      attendees: [{ email: row.email, displayName: row.name }],
      extendedProperties: { private: { archive_booking_id: row.id } },
    };
  }
  async create(row: Record<string, any>) {
    const calendar = row.google_calendar_id ||
        env("GOOGLE_CALENDAR_ID", "primary"),
      id = row.google_event_id || eventId(row.id);
    const existing = await this.get(calendar, id);
    if (existing) {
      if (
        existing.status === "cancelled" ||
        existing.extendedProperties?.private?.archive_booking_id !== row.id
      ) throw new AppError("CALENDAR_EVENT_CONFLICT", 409);
      return { ...existing, calendar };
    }
    await this.available(calendar, row);
    const r = await this.request(`${root(calendar)}?sendUpdates=all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...this.payload(row) }),
    });
    if (r.status === 409) {
      const found = await this.get(calendar, id);
      if (
        found?.extendedProperties?.private?.archive_booking_id === row.id &&
        found.status !== "cancelled"
      ) return { ...found, calendar };
    }
    if (!r.ok) throw new AppError("CALENDAR_CREATE_FAILED", 502);
    return { ...await r.json(), calendar };
  }
  async update(row: Record<string, any>) {
    if (!row.google_event_id) throw new AppError("CALENDAR_EVENT_MISSING", 409);
    const calendar = row.google_calendar_id;
    const current = await this.get(calendar, row.google_event_id);
    if (!current || current.status === "cancelled") {
      throw new AppError("CALENDAR_EVENT_MISSING", 409);
    }
    await this.available(calendar, row, row.google_event_id);
    const r = await this.request(
      `${root(calendar)}/${row.google_event_id}?sendUpdates=all`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.payload(row)),
      },
    );
    if (!r.ok) throw new AppError("CALENDAR_UPDATE_FAILED", 502);
    return { ...await r.json(), calendar };
  }
  async cancel(row: Record<string, any>) {
    const calendar = row.google_calendar_id ||
        env("GOOGLE_CALENDAR_ID", "primary"),
      id = row.google_event_id || eventId(row.id);
    const current = await this.get(calendar, id);
    if (!current || current.status === "cancelled") return;
    if (current.extendedProperties?.private?.archive_booking_id !== row.id) {
      throw new AppError("CALENDAR_EVENT_CONFLICT", 409);
    }
    const r = await this.request(`${root(calendar)}/${id}?sendUpdates=all`, {
      method: "DELETE",
    });
    if (!r.ok && r.status !== 404 && r.status !== 410) {
      throw new AppError("CALENDAR_CANCEL_FAILED", 502);
    }
  }
}
