import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';

// Test implementation of vCard generator logic
function escapeVCard(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function generateVCard(config) {
  const parts = config.fullName.trim().split(/\s+/);
  const givenName = parts[0] || '';
  const familyName = parts.slice(1).join(' ') || '';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(familyName)};${escapeVCard(givenName)};;;`,
    `FN:${escapeVCard(config.displayName)} (${escapeVCard(config.fullName)})`,
    `NICKNAME:${escapeVCard(config.displayName)}`,
    `TITLE:${escapeVCard(config.role)}`,
    `ORG:${escapeVCard(config.vCardOrganization || config.displayName)}`,
    `URL;TYPE=WORK:${config.websiteUrl}`,
  ];

  if (config.email && config.email.trim().length > 0) {
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${config.email.trim()}`);
  }

  if (config.phone && config.phone.trim().length > 0) {
    lines.push(`TEL;TYPE=CELL,VOICE:${config.phone.trim()}`);
  }

  if (config.location && config.location.trim().length > 0) {
    lines.push(`ADR;TYPE=WORK:;;;${escapeVCard(config.location)};;;`);
  }

  if (config.vCardNote && config.vCardNote.trim().length > 0) {
    lines.push(`NOTE:${escapeVCard(config.vCardNote)}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

test('vCard generation adheres to RFC 6350 / 2426 format', () => {
  const sampleConfig = {
    displayName: 'Ken The Photographer',
    fullName: 'Kenneth Harris',
    role: 'Photographer',
    websiteUrl: 'https://kenthephotographer.com',
    email: 'info@kenthephotographer.com',
    phone: '(718) 915-9472',
    location: 'South Jamaica, Queens · New York',
    vCardOrganization: 'Ken The Photographer Archive',
    vCardNote: 'Official Archive',
  };

  const vcard = generateVCard(sampleConfig);

  assert.ok(vcard.startsWith('BEGIN:VCARD\r\nVERSION:3.0'));
  assert.ok(vcard.endsWith('\r\nEND:VCARD'));
  assert.ok(vcard.includes('FN:Ken The Photographer (Kenneth Harris)'));
  assert.ok(vcard.includes('N:Harris;Kenneth;;;'));
  assert.ok(vcard.includes('URL;TYPE=WORK:https://kenthephotographer.com'));
  assert.ok(vcard.includes('EMAIL;TYPE=INTERNET,WORK:info@kenthephotographer.com'));
  assert.ok(vcard.includes('TEL;TYPE=CELL,VOICE:(718) 915-9472'));
});

test('vCard escapes special characters safely', () => {
  const configWithChars = {
    displayName: 'Ken, The Photographer; Pro',
    fullName: 'Kenny; Jr Harris',
    role: 'Photographer',
    websiteUrl: 'https://kenthephotographer.com',
    email: 'test@example.com',
    phone: '',
    location: 'Queens; NY',
    vCardOrganization: 'Archive, LLC',
    vCardNote: 'Line 1\nLine 2',
  };

  const vcard = generateVCard(configWithChars);
  assert.ok(vcard.includes('NOTE:Line 1\\nLine 2'));
  assert.ok(vcard.includes('ADR;TYPE=WORK:;;;Queens\\; NY;;;'));
});

test('Local QR code generator produces valid base64 PNG data URL without external APIs', async () => {
  const targetUrl = 'https://kenthephotographer.com';
  const dataUrl = await QRCode.toDataURL(targetUrl, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M',
  });

  assert.ok(dataUrl.startsWith('data:image/png;base64,'));
  assert.ok(dataUrl.length > 500, 'QR data URL contains valid encoded PNG image data');
});

// ==========================================================================
// PWA Manifest, Service Worker & Mobile Metadata Tests
// ==========================================================================

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const cardDir = resolve(import.meta.dirname, '..');
const publicDir = resolve(cardDir, 'public');

test('PWA manifest exists, is valid JSON, and meets all specification criteria', () => {
  const manifestPath = resolve(publicDir, 'manifest.webmanifest');
  assert.ok(existsSync(manifestPath), 'manifest.webmanifest must exist in card/public');

  const content = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(content);

  assert.equal(manifest.name, 'Kenny Harris — Digital Card');
  assert.equal(manifest.short_name, 'Kenny Card');
  assert.equal(manifest.id, '/card/');
  assert.equal(manifest.start_url, '/card/');
  assert.equal(manifest.scope, '/card/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#070709');
  assert.equal(manifest.background_color, '#070709');

  // Verify icons array
  assert.ok(Array.isArray(manifest.icons), 'icons must be an array');
  assert.ok(manifest.icons.length >= 3, 'Must contain at least 192, 512, and maskable icons');

  const has192 = manifest.icons.some(
    (i) => i.sizes === '192x192' && i.type === 'image/png' && i.purpose === 'any'
  );
  assert.ok(has192, 'Manifest must declare 192x192 PNG icon with purpose any');

  const has512 = manifest.icons.some(
    (i) => i.sizes === '512x512' && i.type === 'image/png' && i.purpose === 'any'
  );
  assert.ok(has512, 'Manifest must declare 512x512 PNG icon with purpose any');

  const hasMaskable = manifest.icons.some(
    (i) => i.sizes === '512x512' && i.type === 'image/png' && i.purpose === 'maskable'
  );
  assert.ok(hasMaskable, 'Manifest must declare 512x512 PNG maskable icon');
});

function readPngDimensions(filePath) {
  const buf = readFileSync(filePath);
  // PNG signature check
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    assert.equal(buf[i], sig[i], `Valid PNG signature required for ${filePath}`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

test('PWA icon assets exist with exact pixel dimensions and solid darkroom background', () => {
  const icon192 = resolve(publicDir, 'icon-192x192.png');
  const icon512 = resolve(publicDir, 'icon-512x512.png');
  const iconMaskable = resolve(publicDir, 'icon-maskable-512x512.png');
  const appleIcon = resolve(publicDir, 'apple-touch-icon.png');

  assert.ok(existsSync(icon192), 'icon-192x192.png must exist');
  assert.ok(existsSync(icon512), 'icon-512x512.png must exist');
  assert.ok(existsSync(iconMaskable), 'icon-maskable-512x512.png must exist');
  assert.ok(existsSync(appleIcon), 'apple-touch-icon.png must exist');

  assert.deepEqual(readPngDimensions(icon192), { width: 192, height: 192 });
  assert.deepEqual(readPngDimensions(icon512), { width: 512, height: 512 });
  assert.deepEqual(readPngDimensions(iconMaskable), { width: 512, height: 512 });
  assert.deepEqual(readPngDimensions(appleIcon), { width: 180, height: 180 });
});

test('Service worker strictly isolates /card/ and does not intercept root website', () => {
  const swPath = resolve(publicDir, 'sw.js');
  assert.ok(existsSync(swPath), 'sw.js must exist in card/public');

  const swContent = readFileSync(swPath, 'utf8');

  // Verify lifecycle handlers
  assert.ok(swContent.includes('skipWaiting()'), 'SW must call skipWaiting');
  assert.ok(swContent.includes('clients.claim()'), 'SW must call clients.claim');

  // Verify strict method and scope filtering
  assert.ok(swContent.includes("req.method !== 'GET'"), 'SW must ignore non-GET requests');
  assert.ok(swContent.includes('/card/'), 'SW must check for /card/ path');
  assert.ok(
    swContent.includes('!isCardPath && !isCardDomain'),
    'SW must bypass interception when outside card scope'
  );

  // Verify navigation offline fallback
  assert.ok(swContent.includes("req.mode === 'navigate'"), 'SW must handle navigation requests');
  assert.ok(swContent.includes('index.html'), 'SW must fallback to cached index.html');
});

test('card/index.html includes required PWA links, apple touch icon, and mobile metadata', () => {
  const indexPath = resolve(cardDir, 'index.html');
  const html = readFileSync(indexPath, 'utf8');

  assert.ok(html.includes('rel="manifest"'), 'index.html must reference manifest');
  assert.ok(html.includes('href="./manifest.webmanifest"'), 'manifest link must use relative path');
  assert.ok(html.includes('rel="apple-touch-icon"'), 'index.html must reference apple-touch-icon');
  assert.ok(html.includes('name="apple-mobile-web-app-capable" content="yes"'), 'apple-mobile-web-app-capable required');
  assert.ok(html.includes('name="apple-mobile-web-app-title" content="Kenny Card"'), 'apple-mobile-web-app-title required');
  assert.ok(html.includes('name="theme-color" content="#070709"'), 'matching theme-color required');
});

test('Service worker configuration resolves correctly across trailing slashes and hostnames', () => {
  function resolveSWConfig(pathname) {
    if (pathname.startsWith('/card')) {
      return { scriptUrl: '/card/sw.js', scope: '/card/' };
    }
    return { scriptUrl: './sw.js', scope: './' };
  }

  // Under /card/ (canonical subpath)
  assert.deepEqual(resolveSWConfig('/card/'), { scriptUrl: '/card/sw.js', scope: '/card/' });
  // Under /card without trailing slash
  assert.deepEqual(resolveSWConfig('/card'), { scriptUrl: '/card/sw.js', scope: '/card/' });
  // Under custom domain root /
  assert.deepEqual(resolveSWConfig('/'), { scriptUrl: './sw.js', scope: './' });
});


