import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal, flushSync } from 'react-dom';
import { ParallaxScene } from './components/ParallaxScene';
import { CustomCameraCursor } from './components/CustomCameraCursor';
import { AudioToggle } from './components/AudioToggle';
import { HeroDepth } from './components/HeroDepth';
import { GalleryGrid } from './components/GalleryGrid';
import './motion.css';
function Experience() {
  const [gallery, setGallery] = useState({ items: [], labels: {} });
  window.renderArchiveGallery = (items, labels) => flushSync(() => setGallery({ items, labels }));
  return <ParallaxScene><CustomCameraCursor /><AudioToggle /><HeroDepth /><a href="#vault" className="camera-label mono cursor-discover">SCROLL TO DISCOVER</a>{createPortal(<GalleryGrid {...gallery} />, document.getElementById('photo-grid'))}</ParallaxScene>;
}
// Wait for the existing deferred archive/config scripts before booting inquiry logic.
const boot = async () => {
  flushSync(() => createRoot(document.getElementById('parallax-root')).render(<Experience />));
  await import('../app.js');
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
