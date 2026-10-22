/**
 * Profile Configuration for Ken The Photographer Digital Business Card
 * 
 * IMPORTANT:
 * - This is the SINGLE SOURCE OF TRUTH for all identity, contact, branding, and link details.
 * - Empty string fields will automatically be hidden from the UI (no broken or blank buttons).
 * - Only verified public information is included. Do not invent missing details.
 */

export interface SocialLink {
  platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'youtube' | 'threads' | 'vimeo';
  label: string;
  url: string;
  iconName?: string;
}

export interface ProfileConfig {
  /** The primary brand/professional identity */
  displayName: string;
  
  /** The individual photographer's real name */
  fullName: string;
  
  /** Professional role / title */
  role: string;
  
  /** Short location or geographic base (verified: South Jamaica, Queens, NY) */
  location: string;
  
  /** Archival tag / brief historic indicator */
  archiveTag: string;

  /** Primary photography website URL */
  websiteUrl: string;
  
  /** Verified contact email address. Set to '' to hide email button */
  email: string;
  
  /** Direct personal email address */
  directEmail?: string;
  
  /** Verified phone number (E.164 or formatted). Set to '' to hide phone button */
  phone: string;

  /** Appointment booking & calendar scheduling URL */
  bookingUrl?: string;

  /** Google Sheets client intake / inquiries spreadsheet URL */
  googleSheetsUrl?: string;
  
  /** Verified social links. Empty array if none verified */
  socialLinks: SocialLink[];
  
  /** Local or hosted portrait image path */
  profileImage: string;
  
  /** Alt text for portrait */
  profileImageAlt: string;
  
  /** Brand emblem/logo path */
  brandLogo: string;
  
  /** Open Graph / Social share preview image */
  socialPreviewImage: string;
  
  /**
   * Public canonical URL for this digital business card.
   * 
   * NOTE FOR DEPLOYMENT:
   * Set this to the production URL where this card is hosted (e.g., "https://card.kenthephotographer.com" or "https://kenthephotographer.com/card").
   * When left empty (''), the app dynamically falls back to window.location.origin + window.location.pathname
   * so local testing and preview deployments work seamlessly.
   */
  canonicalCardUrl: string;

  /** vCard company/organization note */
  vCardOrganization: string;
  
  /** vCard notes string */
  vCardNote: string;
}

export const profileConfig: ProfileConfig = {
  displayName: 'Ken The Photographer',
  fullName: 'Kenneth Harris',
  role: 'Photographer',
  location: 'South Jamaica, Queens · New York',
  archiveTag: 'The Kenneth Harris Archive · 1969–Present',
  
  websiteUrl: 'https://kenthephotographer.com',
  
  // Primary Archive & Inquiries Email
  email: 'info@kenthephotographer.com',
  
  // Direct Personal Gmail
  directEmail: 'kenthephotographer75@gmail.com',
  
  // Confirmed cell phone
  phone: '(718) 915-9472',
  
  // Live Appointment Booking & Google Calendar Sync
  bookingUrl: 'https://kenthephotographer.com/#booking',
  
  // Google Sheets intake and client tracking
  googleSheetsUrl: 'https://docs.google.com/spreadsheets/',
  
  // Social accounts are not publicly verified on the site. Keep empty until provided.
  socialLinks: [],
  
  // Official gold camera emblem
  profileImage: './assets/ktp-camera-emblem.png',
  profileImageAlt: 'Ken The Photographer — KTP Camera Emblem',
  
  // Official brand emblem
  brandLogo: './assets/ktp-gold-emblem.png',
  
  // Social share image
  socialPreviewImage: './assets/kenny-presentation.webp',
  
  // Approved production canonical URL for digital business card
  canonicalCardUrl: 'https://kenthephotographer.com/card',
  
  vCardOrganization: 'Ken The Photographer Archive',
  vCardNote: 'Ken The Photographer (Kenneth Harris) — The Kenneth Harris Photographic Archive. Direct: kenthephotographer75@gmail.com | Archive: info@kenthephotographer.com | Cell: (718) 915-9472 | Website: https://kenthephotographer.com'
};
