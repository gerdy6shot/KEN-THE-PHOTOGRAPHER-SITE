import React, { useEffect, useRef } from 'react';
import { detectPlatform, type BeforeInstallPromptEvent } from '../utils/pwa';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallSuccess?: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  installPrompt,
  onInstallSuccess,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const platform = detectPlatform();

  // Focus management
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle ESC key
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

  const handleNativeInstall = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted' && onInstallSuccess) {
        onInstallSuccess();
      }
      onClose();
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-header-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c9a96e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="2" width="16" height="20" rx="3" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
            </svg>
          </div>
          <h2 id="install-modal-title" className="modal-title art-serif">
            Install Digital Card
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close installation instructions modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-instructions">
            Install Kenny Harris’s card on your phone for instant, one-tap access even when offline.
          </p>

          {/* If browser supports native install prompt */}
          {installPrompt && (
            <div className="install-prompt-box">
              <p className="install-prompt-text mono">
                Your browser is ready to install this card directly to your home screen:
              </p>
              <button
                type="button"
                onClick={handleNativeInstall}
                className="btn-modal-action btn-gold mono"
                style={{ width: '100%', marginBottom: '16px' }}
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Install App Now
              </button>
            </div>
          )}

          {/* iOS Safari Instructions */}
          {platform.isIOS && (
            <div className="install-steps-list" aria-label="iPhone installation instructions">
              <div className="install-step-item">
                <div className="install-step-num mono">1</div>
                <div className="install-step-content">
                  <div className="install-step-title">Tap Share in Safari</div>
                  <div className="install-step-desc">
                    Tap the <strong>Share</strong> icon
                    <span className="inline-icon-pill" aria-label="Share icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </span>
                    at the bottom of your Safari screen.
                  </div>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num mono">2</div>
                <div className="install-step-content">
                  <div className="install-step-title">Add to Home Screen</div>
                  <div className="install-step-desc">
                    Scroll down and tap <strong>Add to Home Screen</strong>
                    <span className="inline-icon-pill" aria-label="Plus in square icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </span>.
                  </div>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num mono">3</div>
                <div className="install-step-content">
                  <div className="install-step-title">Confirm & Add</div>
                  <div className="install-step-desc">
                    Tap <strong>Add</strong> in the top-right corner. The card will appear as an app on your home screen.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android instructions when prompt is not active */}
          {!platform.isIOS && !installPrompt && (
            <div className="install-steps-list" aria-label="Browser installation instructions">
              <div className="install-step-item">
                <div className="install-step-num mono">1</div>
                <div className="install-step-content">
                  <div className="install-step-title">Open Browser Menu</div>
                  <div className="install-step-desc">
                    Tap the <strong>three dots (⋮)</strong> menu in the upper-right corner of Chrome or your browser.
                  </div>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num mono">2</div>
                <div className="install-step-content">
                  <div className="install-step-title">Select Install or Add</div>
                  <div className="install-step-desc">
                    Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </div>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num mono">3</div>
                <div className="install-step-content">
                  <div className="install-step-title">Confirm Installation</div>
                  <div className="install-step-desc">
                    Tap <strong>Install</strong> to add Kenny’s card to your app drawer and home screen.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-action btn-secondary mono"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallModal;
