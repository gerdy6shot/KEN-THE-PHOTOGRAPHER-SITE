import React, { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { motionAllowed } from '../motion-config';
const Context = createContext(false);
export const useSceneMotion = () => useContext(Context);
export function ParallaxScene({ children }) {
  const [policy, setPolicy] = useState({ reduced: true, fine: false });
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)');
    const update = () => setPolicy({ reduced: reduced.matches, fine: fine.matches });
    update();
    reduced.addEventListener('change', update); fine.addEventListener('change', update);
    return () => { reduced.removeEventListener('change', update); fine.removeEventListener('change', update); };
  }, []);
  const enabled = motionAllowed(policy.reduced, policy.fine, paused);
  return <Context.Provider value={enabled}><MotionConfig reducedMotion="user">
    {children}
    {!policy.reduced && policy.fine && <button className="motion-toggle mono" onClick={() => setPaused(v => !v)} aria-pressed={paused} aria-label="Pause decorative motion">{paused ? 'RESUME MOTION' : 'PAUSE MOTION'}</button>}
  </MotionConfig></Context.Provider>;
}
