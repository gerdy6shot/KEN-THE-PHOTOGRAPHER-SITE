import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardUrl: string;
  displayName: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  cardUrl,
  displayName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [qrGenerated, setQrGenerated] = useState<boolean>(false);

  // Focus management: focus the close button when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate QR code onto canvas when open
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      cardUrl,
      {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) {
          console.error('Failed to generate QR code:', error);
          setQrGenerated(false);
        } else {
          setQrGenerated(true);
        }
      }
    );
  }, [isOpen, cardUrl]);

  if (!isOpen) return null;

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ken-the-photographer-qr.png`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 500);
    } catch (err) {
      console.error('Failed to download QR code image:', err);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopyStatus('Copied to clipboard!');
      setTimeout(() => setCopyStatus(''), 3000);
    } catch {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="mono text-gold-eyebrow">DIGITAL CONNECT</span>
            <h2 id="qr-modal-title" className="modal-title art-serif">
              Scan Card
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close QR code modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-instructions">
            Scan to connect with <strong className="text-highlight">{displayName}</strong>.
          </p>

          {/* High-contrast QR display card */}
          <div className="qr-plate" aria-label="QR Code for digital business card">
            <canvas ref={canvasRef} className="qr-canvas" />
          </div>

          <div className="qr-url-box">
            <span className="qr-url-label mono">Card URL</span>
            <div className="qr-url-display mono" title={cardUrl}>
              {cardUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="btn-copy-url mono"
              aria-label="Copy card link to clipboard"
            >
              {copyStatus ? copyStatus : 'Copy Link'}
            </button>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleDownloadQR}
              disabled={!qrGenerated}
              className="btn-modal-action btn-gold mono"
            >
              <svg
                className="btn-icon"
                width="16"
                height="16"
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
              Download QR Image
            </button>
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
