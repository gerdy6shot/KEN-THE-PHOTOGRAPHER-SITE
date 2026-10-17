import React, { useEffect, useRef, useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardUrl: string;
  displayName: string;
  onOpenQR: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  cardUrl,
  displayName,
  onOpenQR,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = cardUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={onClose}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="mono text-gold-eyebrow">SPREAD THE WORD</span>
            <h2 id="share-modal-title" className="modal-title art-serif">
              Share Card
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close share modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-instructions">
            Share <strong className="text-highlight">{displayName}</strong>’s digital card link via messaging, email, or social apps.
          </p>

          <div className="share-link-preview mono">
            <div className="share-link-text" title={cardUrl}>
              {cardUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`btn-copy-card mono ${copied ? 'is-copied' : ''}`}
              aria-label="Copy digital business card link"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="share-options-list">
            <button
              type="button"
              onClick={handleCopy}
              className="share-option-btn mono"
            >
              <svg
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
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Card Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenQR();
              }}
              className="share-option-btn mono"
            >
              <svg
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
              <span>Show & Download QR Code</span>
            </button>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-action btn-secondary mono"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
