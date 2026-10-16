// Public booking requests; Google credentials and approval remain server-side.
const endpoint = import.meta.env.VITE_SUPABASE_URL || 'https://koyankycsshjsezaqdbm.supabase.co';
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export async function submitBooking(payload) {
  if (!endpoint) throw new Error('Online booking requests are temporarily unavailable. Please email info@kenthephotographer.com.');
  const headers = { 'Content-Type': 'application/json' };
  if (publicKey?.startsWith('sb_publishable_')) headers.apikey = publicKey;
  const response = await fetch(endpoint.replace(/\/$/, '') + '/functions/v1/create-booking', {
    method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(60000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true || !result.booking_id || result.status !== 'requested') {
    throw new Error(response.status === 429 ? 'Too many requests. Please try again later.' : 'We could not confirm receipt. Please try again or email info@kenthephotographer.com.');
  }
  return result;
}
