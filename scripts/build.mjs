import { build, loadEnv } from 'vite';
import { cp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
const files = ['archive-data.js', 'site-config.js', 'favicon.svg', '_headers', 'admin.html'];

// Load environment variables from .env.local or .env if present
if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(resolve(root, '.env.local')); } catch {}
  try { process.loadEnvFile(resolve(root, '.env')); } catch {}
}

const loadedEnv = loadEnv('production', root, 'VITE_');
const supabaseUrl = process.env.VITE_SUPABASE_URL || loadedEnv.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || loadedEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Pre-build validation: VITE_SUPABASE_URL must be present and must target koyankycsshjsezaqdbm
const EXPECTED_HOST = 'koyankycsshjsezaqdbm.supabase.co';
if (!supabaseUrl) {
  throw new Error(`[BUILD ERROR] Required VITE_SUPABASE_URL is missing. Expected https://${EXPECTED_HOST}`);
}

try {
  const parsed = new URL(supabaseUrl);
  if (parsed.hostname !== EXPECTED_HOST) {
    throw new Error(`[BUILD ERROR] VITE_SUPABASE_URL points to ${parsed.hostname}; must point to ${EXPECTED_HOST}`);
  }
} catch (err) {
  throw new Error(`[BUILD ERROR] Invalid VITE_SUPABASE_URL "${supabaseUrl}": ${err.message}`);
}

process.env.VITE_SUPABASE_URL = supabaseUrl;
if (publishableKey) {
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = publishableKey;
}

await rm(output, { recursive: true, force: true });

// Run Vite production build with explicit define values
await build({
  root,
  mode: 'production',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(publishableKey),
  },
});

for (const file of files) await cp(resolve(root, file), resolve(output, file));
await cp(resolve(root, 'assets'), resolve(output, 'assets'), { recursive: true });

const source = await readFile(resolve(root, 'archive-data.js'), 'utf8');
const items = JSON.parse(source.slice(source.indexOf('['), source.lastIndexOf(']') + 1));
for (const item of items) await stat(resolve(output, item.image));

// Post-build validation: Verify compiled bundles embed Supabase host and contain NO fallback error
const assetsDir = resolve(output, 'assets');
const assetEntries = await readdir(assetsDir);
let hasSupabaseHost = false;
let hasUnavailableError = false;

for (const entry of assetEntries) {
  if (!entry.endsWith('.js')) continue;
  const content = await readFile(resolve(assetsDir, entry), 'utf8');
  if (content.includes('temporarily unavailable')) {
    hasUnavailableError = true;
    console.error(`[BUILD ERROR] Found fallback 'temporarily unavailable' error in ${entry}`);
  }
  if (content.includes(EXPECTED_HOST)) {
    hasSupabaseHost = true;
  }
}

if (hasUnavailableError) {
  await rm(output, { recursive: true, force: true });
  throw new Error('[BUILD ERROR] Build generated broken client bundles with "temporarily unavailable" fallback.');
}

if (!hasSupabaseHost) {
  await rm(output, { recursive: true, force: true });
  throw new Error(`[BUILD ERROR] Client bundles do not contain the target Supabase host ${EXPECTED_HOST}.`);
}

console.log(`Cloudflare build ready: ${items.length} archive records. Target Supabase (${EXPECTED_HOST}) verified.`);
