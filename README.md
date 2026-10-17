# Ken The Photographer — Digital Business Card

A mobile-first, editorial digital business card for **Ken The Photographer** (**Kenny Harris**).

Built to introduce Kenny, connect visitors to his photography archive website ([kenthephotographer.com](https://kenthephotographer.com)), download his contact card (.vcf), and share his card directly across iOS and Android devices.

---

## 1. Project Overview

- **Identity**: Ken The Photographer (Kenny Harris)
- **Role**: Photographer
- **Archive**: The Kenneth Harris Archive · 1969–Present
- **Location**: South Jamaica, Queens · New York
- **Website**: [https://kenthephotographer.com](https://kenthephotographer.com)
- **Tech Stack**: React 19, TypeScript, Vite, CSS (Custom Editorial Darkroom Theme), `qrcode` (local zero-external-API QR generation)

---

## 2. Profile Configuration File

All editable information is centralized in a single typed configuration file:

📁 **[`src/profileConfig.ts`](file:///Users/gerdyabelard/.gemini/antigravity/scratch/ken-the-photographer-card/src/profileConfig.ts)**

```typescript
export const profileConfig: ProfileConfig = {
  displayName: 'Ken The Photographer',
  fullName: 'Kenny Harris',
  role: 'Photographer',
  location: 'South Jamaica, Queens · New York',
  archiveTag: 'The Kenneth Harris Archive · 1969–Present',
  websiteUrl: 'https://kenthephotographer.com',
  email: 'info@kenthephotographer.com',
  phone: '', // Leave empty to automatically hide phone action
  socialLinks: [], // Add verified links when available
  profileImage: '/assets/kenny-portrait.webp',
  profileImageAlt: 'Kenny Harris — Ken The Photographer',
  brandLogo: '/assets/ktp-gold-emblem.png',
  socialPreviewImage: '/assets/kenny-presentation.webp',
  canonicalCardUrl: '', // Set before printing physical QR cards
  vCardOrganization: 'Ken The Photographer Archive',
  vCardNote: 'Ken The Photographer (Kenny Harris) — The Kenneth Harris Photographic Archive. Visit https://kenthephotographer.com',
};
```

> **Note on Canonical Card URL**:
> If `canonicalCardUrl` is set to `''`, the application automatically uses `window.location.origin + window.location.pathname` for local testing and staging previews. Set this to the production URL (e.g. `https://card.kenthephotographer.com`) before producing printed QR cards.

---

## 3. Setup and Commands

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run automated tests (vCard format, QR generation, URL handling)
npm test

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 4. Deployment Instructions

### Cloudflare Pages (Recommended)
1. Build output directory: `dist`
2. Build command: `npm run build`
3. Custom domain: e.g. `card.kenthephotographer.com` or deploy to a subpath

### Static Hosting (Vercel, Netlify, or Apache/Nginx)
The output in `dist/` is completely static (HTML, CSS, JS, WebP/PNG assets, SVG). Simply upload the contents of `dist/` to any static web root or CDN.

---

## 5. Itemized List of Missing or Unverified Information

In accordance with strict verification rules, only information verified directly from [kenthephotographer.com](https://kenthephotographer.com) has been enabled:

| Field | Status | Behavior in Digital Card |
|---|---|---|
| **Display Name** | Verified (`Ken The Photographer`) | Displayed prominently as primary title |
| **Full Name** | Verified (`Kenny Harris`) | Displayed as supporting subtitle and in vCard |
| **Website** | Verified (`https://kenthephotographer.com`) | Hero primary gold button |
| **Email** | Verified (`info@kenthephotographer.com`) | Rendered in actions section and included in vCard |
| **Portrait** | Verified (`kenny-portrait.webp`) | Authentic high-res portrait displayed in darkroom frame |
| **Brand Emblem** | Verified (`ktp-gold-emblem.png`) | Header masthead badge |
| **Phone Number** | **Not Verified** | Left blank in `src/profileConfig.ts`; button hidden cleanly |
| **Social Links** | **Not Verified** | Left empty in `src/profileConfig.ts`; section hidden cleanly |

To add phone or social accounts in the future, edit `src/profileConfig.ts`. The UI will display them automatically without broken or blank buttons.

---

## 6. Verification & Testing Summary

### Automated Checks Performed
- **TypeScript & Build**: Passed with `0` errors (`tsc -b && vite build`).
- **vCard Compliance**: Validated RFC 3.0 formatting, family/given name extraction (`Harris;Kenny`), character escaping, correct MIME type and dynamic download triggering.
- **Local QR Code Generation**: Validated local canvas and base64 PNG data URL generation using `qrcode` without any third-party external APIs.
- **Preview Server**: Successfully served and verified via HTTP loopback on port 4173.

### Physical-Device Verification Notice
- Real-device AirDrop, Quick Share, and iOS/Android Contact Book importing require opening the card URL on an active mobile device (as web browsers in automated headless environments simulate standard click events and Web Share API fallbacks).
