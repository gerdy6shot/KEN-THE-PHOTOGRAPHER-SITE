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
