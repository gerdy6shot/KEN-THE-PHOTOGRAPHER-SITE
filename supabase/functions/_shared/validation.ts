import { AppError } from "./core.ts";
export const inquiryTypes = [
  "General inquiry",
  "Fine art print",
  "Image licensing",
  "Exhibition or institutional acquisition",
  "Interview or speaking engagement",
  "Archival patronage",
  "Exhibition book",
  "Documentary merchandise",
  "Documentary support",
  "Archive preservation",
];
export function text(v: unknown, max: number, mandatory = false): string {
  if (v === undefined || v === null) {
    if (mandatory) throw new AppError("MISSING_FIELDS", 400);
    return "";
  }
  if (typeof v !== "string") throw new AppError("INVALID_FIELD", 400);
  const s = v.normalize("NFC").replace(
    // deno-lint-ignore no-control-regex -- strip unsafe control characters from input
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
    "",
  ).trim();
  if (mandatory && !s) throw new AppError("MISSING_FIELDS", 400);
  if (s.length > max) throw new AppError("FIELD_TOO_LONG", 400);
  return s;
}
export function email(v: unknown) {
  const s = text(v, 254, true).toLowerCase();
  if (!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(s)) {
    throw new AppError("INVALID_EMAIL", 400);
  }
  return s;
}
export function uuid(v: unknown) {
  const s = text(v, 36, true);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(s)
  ) throw new AppError("INVALID_ID", 400);
  return s;
}
function person(v: Record<string, unknown>) {
  if (v.website) throw new AppError("INVALID_SUBMISSION", 400);
  return {
    name: text(v.name, 120, true),
    email: email(v.email),
    phone: text(v.phone, 40),
    organization: text(v.organization, 180),
  };
}
export function inquiry(v: Record<string, unknown>) {
  const inquiry_type = text(v.inquiry_type, 80, true);
  if (!inquiryTypes.includes(inquiry_type)) {
    throw new AppError("INVALID_INQUIRY_TYPE", 400);
  }
  const photograph_id = text(v.photograph_id, 60);
  if (photograph_id && !/^KTP-[A-Z]+-\d{3}$/.test(photograph_id)) {
    throw new AppError("INVALID_PHOTOGRAPH", 400);
  }
  return {
    ...person(v),
    inquiry_type,
    photograph_id,
    photograph_title: text(v.photograph_title, 240),
    message: text(v.message, 5000, true),
    idempotency_key: uuid(v.idempotency_key),
  };
}
export function booking(v: Record<string, unknown>) {
  const start = text(v.requested_start, 40, true),
    end = text(v.requested_end, 40, true),
    timezone = text(v.timezone, 80, true);
  const iso =
    /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(Z|[+-]\d\d:\d\d)$/;
  if (
    !iso.test(start) || !iso.test(end) || !Number.isFinite(Date.parse(start)) ||
    !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start) ||
    Date.parse(end) - Date.parse(start) > 86400000
  ) throw new AppError("INVALID_BOOKING_TIME", 400);
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
  } catch {
    throw new AppError("INVALID_TIMEZONE", 400);
  }
  return {
    ...person(v),
    booking_type: text(v.booking_type, 100, true),
    requested_start: new Date(start).toISOString(),
    requested_end: new Date(end).toISOString(),
    timezone,
    notes: text(v.notes, 5000),
    idempotency_key: uuid(v.idempotency_key),
  };
}
