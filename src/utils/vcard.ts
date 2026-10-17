import type { ProfileConfig } from '../profileConfig';

/**
 * Escapes special characters for vCard 3.0 fields
 */
function escapeVCard(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generates an RFC-compliant vCard 3.0 string based on the profile configuration.
 */
export function generateVCard(config: ProfileConfig): string {
  const parts = config.fullName.trim().split(/\s+/);
  const givenName = parts[0] || '';
  const familyName = parts.slice(1).join(' ') || '';

  const lines: string[] = [
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

/**
 * Initiates a downloadable vCard (.vcf) flow across mobile and desktop browsers.
 */
export function downloadVCard(config: ProfileConfig): void {
  const vcardText = generateVCard(config);
  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Clean filename: Kenny-Harris-Ken-The-Photographer.vcf
  const safeFullName = config.fullName.replace(/[^a-zA-Z0-9_-]/g, '-');
  const safeDisplayName = config.displayName.replace(/[^a-zA-Z0-9_-]/g, '-');
  const filename = `${safeFullName}-${safeDisplayName}.vcf`;
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup object URL
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 1500);
}
