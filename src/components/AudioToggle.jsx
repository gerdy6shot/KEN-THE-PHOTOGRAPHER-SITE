import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createShutterAudio } from '../shutter-audio';
export function AudioToggle() {
  const audio = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  const [host, setHost] = useState(document.body);
  useEffect(() => {
    audio.current = createShutterAudio();
    const updateHost = () => setHost([...document.querySelectorAll("dialog[open]")].at(-1) || document.body);
    const observer = new MutationObserver(updateHost);
    document.querySelectorAll("dialog").forEach(dialog => observer.observe(dialog, { attributes: true, attributeFilter: ["open"] }));
    const play = event => {
      if (event.pointerType === 'mouse' && !event.target.closest('.audio-toggle')) {
        audio.current.play().catch(() => { audio.current.mute(); setEnabled(false); setFailed(true); });
      }
    };
    document.addEventListener('pointerdown', play, true);
    return () => { observer.disconnect(); document.removeEventListener('pointerdown', play, true); audio.current.dispose(); };
  }, []);
  const toggle = async () => {
    if (enabled) { audio.current.mute(); setEnabled(false); return; }
    try { await audio.current.enable(); setEnabled(true); setFailed(false); await audio.current.play(); }
    catch { setFailed(true); setEnabled(false); }
  };
  return createPortal(<div className="audio-control"><button type="button" className="audio-toggle mono" aria-label="Shutter sound" aria-pressed={enabled} onClick={toggle}>{enabled ? 'SOUND ON' : 'SOUND OFF'} <span aria-hidden="true">{enabled ? '◉' : '○'}</span></button><span className="audio-status" role="status">{failed ? 'Sound unavailable in this browser.' : ''}</span></div>, host);
}
