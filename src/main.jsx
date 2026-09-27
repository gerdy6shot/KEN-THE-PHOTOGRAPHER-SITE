import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal, flushSync } from 'react-dom';
import { ParallaxScene } from './components/ParallaxScene';
import { FloatingCamera } from './components/FloatingCamera';
import { GalleryGrid } from './components/GalleryGrid';
import './motion.css';
function Experience() {
  const [gallery, setGallery] = useState({ items: [], labels: {} });
  window.renderArchiveGallery = (items, labels) => flushSync(() => setGallery({ items, labels }));
  return <ParallaxScene><FloatingCamera />{createPortal(<GalleryGrid {...gallery} />, document.getElementById('photo-grid'))}</ParallaxScene>;
}
// Wait for the existing deferred archive/config scripts before booting inquiry logic.
const boot = async () => {
  flushSync(() => createRoot(document.getElementById('parallax-root')).render(<Experience />));
  await import('../app.js');
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
