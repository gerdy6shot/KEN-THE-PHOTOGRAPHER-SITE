import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSceneMotion } from './ParallaxScene';
import { motionConfig as c, smoothing } from '../motion-config';
gsap.registerPlugin(ScrollTrigger);
export function FloatingCamera() {
  const ref = useRef(null);
  const enabled = useSceneMotion();
  useEffect(() => {
    const element = ref.current;
    if (!enabled) { element.style.transform = ''; return; }
    const hero = element.closest('.hero');
    let targetX = 0, targetY = 0, x = 0, y = 0, progress = 0, scroll = 0;
    let frame = 0, last = 0, elapsed = 0, visible = false;
    const move = e => {
      if (e.pointerType !== 'mouse') return;
      const box = hero.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (e.clientX - box.left) / box.width * 2 - 1));
      targetY = Math.max(-1, Math.min(1, (e.clientY - box.top) / box.height * 2 - 1));
    };
    const leave = () => { targetX = targetY = 0; };
    const tick = now => {
      const dt = last ? (now - last) / 1000 : 1 / 60; last = now;
      elapsed += Math.min(dt, 0.05);
      const a = smoothing(dt, c.response);
      x += (targetX - x) * a; y += (targetY - y) * a; scroll += (progress - scroll) * a;
      const bob = Math.sin(elapsed * Math.PI * 2 / c.period) * c.levitation;
      element.style.transform = `translate3d(${x*c.pointerTravel}px,${y*c.pointerTravel+bob+scroll*c.scrollTravel}px,${c.depth}px) rotateX(${-y*c.pitch+scroll*c.scrollPitch}deg) rotateY(${x*c.yaw}deg)`;
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); last = 0;
      element.style.willChange = visible && !document.hidden ? 'transform' : 'auto';
      if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(hero);
    const trigger = ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: self => { progress = self.progress; } });
    hero.addEventListener('pointermove', move, { passive: true }); hero.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', sync);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); trigger.kill();
      hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', sync);
      element.style.transform = ''; element.style.willChange = '';
    };
  }, [enabled]);
  return <a href="#vault" className="floating-camera group" aria-label="Explore the Vault — scroll to discover" style={{ perspective: c.perspective }}>
    <span ref={ref} className="camera-object block"><img src="/assets/images/nikon-camera.png" width="1536" height="1024" alt="" decoding="async" draggable="false" /></span>
    <span className="camera-label mono">SCROLL TO DISCOVER</span>
  </a>;
}
