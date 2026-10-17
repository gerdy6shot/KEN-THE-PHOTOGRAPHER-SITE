import { profileConfig } from '../profileConfig';

/**
 * Returns the effective canonical URL for the digital business card.
 * 
 * If `canonicalCardUrl` is defined in profileConfig, it is used directly.
 * Otherwise, dynamically uses the current browser origin + pathname
 * (stripping out any query params or hash fragments) for local testing and staging.
 */
export function getCardUrl(): string {
  if (profileConfig.canonicalCardUrl && profileConfig.canonicalCardUrl.trim().length > 0) {
    return profileConfig.canonicalCardUrl.trim();
  }

  if (typeof window !== 'undefined' && window.location) {
    // Strip hash and search parameters for a clean canonical card link
    return `${window.location.origin}${window.location.pathname}`;
  }

  return profileConfig.websiteUrl;
}
