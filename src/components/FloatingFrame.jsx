import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSceneMotion } from './ParallaxScene';
import { motionConfig as c } from '../motion-config';
gsap.registerPlugin(ScrollTrigger);
export function FloatingFrame({ children, index }) {
  const ref = useRef(null);
  const enabled = useSceneMotion();
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const context = gsap.context(() => {
      gsap.fromTo(ref.current, { y: c.frameDrift, rotationX: c.frameTilt, rotationY: (index % 2 ? -1 : 1) * c.frameTilt, z: -25, scale: 0.97 }, {
        y: 0, rotationX: 0, rotationY: 0, z: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top 95%', end: 'top 45%', scrub: 0.7,
          onToggle: self => { ref.current.style.willChange = self.isActive ? 'transform' : 'auto'; } },
      });
    }, ref);
    return () => { context.revert(); if (ref.current) ref.current.style.willChange = ''; };
  }, [enabled, index]);
  return <div ref={ref} className="floating-frame relative min-w-0" data-motion={enabled} style={{ perspective: c.perspective }}>
    <motion.figure className="photo-card" animate={{ z: enabled && focused ? c.frameLift : 0, y: enabled && focused ? -5 : 0 }}
      whileHover={enabled ? { z: c.frameLift, y: -5 } : undefined}
      transition={{ type: 'spring', stiffness: 180, damping: 25, duration: enabled ? undefined : 0 }}
      onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
      {children}
    </motion.figure>
  </div>;
}
