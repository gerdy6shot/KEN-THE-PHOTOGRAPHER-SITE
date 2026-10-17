import React, { useState } from 'react';
import { profileConfig } from './profileConfig';
import { getCardUrl } from './utils/url';
import { downloadVCard } from './utils/vcard';
import { QRCodeModal } from './components/QRCodeModal';
import { ShareModal } from './components/ShareModal';

export const App: React.FC = () => {
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const cardUrl = getCardUrl();

  const announceStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  };

  const handleSaveContact = () => {
    try {
      downloadVCard(profileConfig);
      announceStatus('Contact file downloaded. Open the file to import to your device contacts.');
    } catch (err) {
      console.error('Failed to download vCard:', err);
      announceStatus('Unable to download contact file. Please try again.');
    }
  };

  const handleShareCard = async () => {
    const shareData = {
      title: profileConfig.displayName,
      text: `Connect with ${profileConfig.fullName} — ${profileConfig.displayName}.`,
      url: cardUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        // Successful native share completed
      } catch (err: unknown) {
        // User aborted/cancelled sharing or share permission denied
        const error = err as { name?: string };
        if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
          // If native share encountered an unexpected failure, fall back to share modal
          setIsShareModalOpen(true);
        }
      }
    } else {
      // Fallback modal for desktop browsers or environments without Web Share API
      setIsShareModalOpen(true);
    }
  };

  return (
    <div className="card-shell">
      {/* Background subtle ambiance */}
      <div className="bg-glow" aria-hidden="true" />

      {/* Screen reader status announcement */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </div>

      <main className="card-container" id="main-content">
        {/* Masthead archive badge */}
        <header className="card-masthead">
          <div className="masthead-badge mono">
            {profileConfig.brandLogo && (
              <img
                src={profileConfig.brandLogo}
                alt=""
                className="masthead-emblem"
                width="20"
                height="20"
                aria-hidden="true"
              />
            )}
            <span>{profileConfig.archiveTag}</span>
          </div>
          {profileConfig.location && (
            <span className="masthead-location mono">{profileConfig.location}</span>
          )}
        </header>

        {/* Hero Portrait & Identity */}
        <section className="card-profile" aria-label="Photographer Profile">
          <div className="portrait-frame">
            <img
              src={profileConfig.profileImage}
              alt={profileConfig.profileImageAlt}
              className="portrait-img"
              width="360"
              height="450"
              fetchPriority="high"
            />
            <div className="portrait-overlay" aria-hidden="true" />
            <div className="portrait-tag mono" aria-hidden="true">
              KTP · NY
            </div>
          </div>

          <div className="identity-block">
            <div className="role-pill mono">{profileConfig.role}</div>
            <h1 className="display-name art-serif">{profileConfig.displayName}</h1>
            <p className="full-name">{profileConfig.fullName}</p>
          </div>
        </section>

        {/* Live Feedback Toast if active */}
        {statusMessage && (
          <div className="status-toast mono" role="status" aria-live="polite">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="toast-icon"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <nav className="actions-section" aria-label="Contact and Card Actions">
          {/* 1. Prominent View Website */}
          <a
            href={profileConfig.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-action btn-hero-gold"
          >
            <span className="btn-inner">
              <svg
                className="action-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="btn-label-group">
                <span className="btn-title">View Website</span>
                <span className="btn-sub mono">kenthephotographer.com</span>
              </span>
            </span>
            <span className="btn-arrow" aria-hidden="true">
              ↗
            </span>
          </a>

          {/* 2. Save Contact (vCard) */}
          <button
            type="button"
            onClick={handleSaveContact}
            className="btn-action btn-surface"
            aria-label="Save contact to your phone or computer"
          >
            <span className="btn-inner">
              <svg
                className="action-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span className="btn-label-group">
                <span className="btn-title">Save Contact</span>
                <span className="btn-sub mono">Add to Address Book (.vcf)</span>
              </span>
            </span>
            <span className="btn-badge mono" aria-hidden="true">
              VCF
            </span>
          </button>

          {/* 3. Secondary Row: Share Card & Show QR Code */}
          <div className="action-row-split">
            <button
              type="button"
              onClick={handleShareCard}
              className="btn-action-half btn-surface"
              aria-label="Share this digital business card"
            >
              <svg
                className="action-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Share Card</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQRModalOpen(true)}
              className="btn-action-half btn-surface"
              aria-label="Show QR Code to scan from another device"
            >
              <svg
                className="action-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Show QR</span>
            </button>
          </div>

          {/* Verified Contact Channels: Only rendered when configured */}
          {profileConfig.email && (
            <a
              href={`mailto:${profileConfig.email}`}
              className="btn-action btn-surface"
              aria-label={`Send email to ${profileConfig.email}`}
            >
              <span className="btn-inner">
                <svg
                  className="action-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="btn-label-group">
                  <span className="btn-title">Email Archive & Inquiries</span>
                  <span className="btn-sub mono">{profileConfig.email}</span>
                </span>
              </span>
              <span className="btn-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          )}

          {profileConfig.phone && (
            <a
              href={`tel:${profileConfig.phone}`}
              className="btn-action btn-surface"
              aria-label={`Call ${profileConfig.phone}`}
            >
              <span className="btn-inner">
                <svg
                  className="action-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="btn-label-group">
                  <span className="btn-title">Direct Phone</span>
                  <span className="btn-sub mono">{profileConfig.phone}</span>
                </span>
              </span>
              <span className="btn-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          )}

          {/* Social Links (Rendered only if populated) */}
          {profileConfig.socialLinks && profileConfig.socialLinks.length > 0 && (
            <div className="social-links-grid" aria-label="Social Profiles">
              {profileConfig.socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-social mono"
                  aria-label={`${social.label} profile`}
                >
                  <span>{social.label}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </nav>

        {/* Card Footer */}
        <footer className="card-footer mono">
          <p className="footer-copyright">
            © {new Date().getFullYear()} {profileConfig.fullName.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
          <p className="footer-sub">THE KENNETH HARRIS PHOTOGRAPHIC ARCHIVE</p>
        </footer>
      </main>

      {/* Accessible Modals */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        cardUrl={cardUrl}
        displayName={profileConfig.displayName}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        cardUrl={cardUrl}
        displayName={profileConfig.displayName}
        onOpenQR={() => setIsQRModalOpen(true)}
      />
    </div>
  );
};

export default App;
