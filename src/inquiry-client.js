const endpoint = import.meta.env.VITE_SUPABASE_URL;
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export async function submitInquiry(payload) {
  if (!endpoint) throw new Error('Online inquiries are temporarily unavailable. Please email info@kenthephotographer.com.');
  const headers = { 'Content-Type': 'application/json' };
  // A browser-safe publishable key is optional for this intentionally public endpoint.
  if (publicKey?.startsWith('sb_publishable_')) headers.apikey = publicKey;
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/functions/v1/submit-inquiry`, {
    method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(60000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true || !result.inquiry_id) {
    throw new Error(response.status === 429
      ? 'Too many requests. Please try again later or email info@kenthephotographer.com.'
      : 'We could not confirm receipt. Please try again or email info@kenthephotographer.com.');
  }
  return result;
}
