import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSceneMotion } from './ParallaxScene';
import { smoothing } from '../motion-config';
import { cursorConfig as c, clampTilt } from '../cursor-config';
export function CustomCameraCursor() {
  const enabled = useSceneMotion();
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !loaded) return;
    let x=0, y=0, tx=0, ty=0, rx=0, ry=0, scale=1, active=false, pressed=false, hover=false, raf=0, last=0;
    const hide = () => { active=false; cancelAnimationFrame(raf); raf=0; el.style.opacity='0'; document.body.classList.remove('camera-cursor-active'); };
    const tick = now => {
      raf=0; const dt=last ? (now-last)/1000 : 1/60; last=now;
      const a=smoothing(dt,c.lag); const dx=tx-x,dy=ty-y;
      x+=dx*a; y+=dy*a; rx+=(clampTilt(-dy)-rx)*a; ry+=(clampTilt(dx)-ry)*a;
      const targetScale=pressed ? c.pressedScale : hover ? c.hoverScale : 1;
      scale+=(targetScale-scale)*a;
      el.style.transform=`translate3d(${x}px,${y}px,0)`;
      el.firstElementChild.style.transform=`perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${ry*0.35}deg) scale(${scale})`;
      if (active && (Math.abs(dx)+Math.abs(dy)+Math.abs(rx)+Math.abs(ry)+Math.abs(scale-targetScale)>0.01)) raf=requestAnimationFrame(tick);
    };
    const wake=()=>{ if (!raf && active) {last=0;raf=requestAnimationFrame(tick);} };
    const move=e=>{
      if(e.pointerType!=='mouse') {hide();return;}
      tx=e.clientX;ty=e.clientY;
      if (!active) {x=tx;y=ty;active=true;el.style.transform=`translate3d(${x}px,${y}px,0)`;el.style.opacity='1';document.body.classList.add('camera-cursor-active');}
      hover=!!e.target.closest('a,button,input,select,textarea,summary,[role="button"],.photo-open'); wake();
    };
    const down=e=>{if(e.pointerType==='mouse'){move(e);pressed=true;wake();}};
    const up=()=>{pressed=false;wake();};
    const key=e=>{if(e.key==='Tab'||e.key==='Escape') hide();};
    const visibility=()=>{if(document.hidden) hide();};
    // A noninteractive manual popover keeps the cursor above native modal dialogs.
    const promote=()=>{ if(typeof el.showPopover==='function') {if(el.matches(':popover-open'))el.hidePopover();el.showPopover();} };
    promote();
    const observer=new MutationObserver(promote);
    document.querySelectorAll('dialog').forEach(dialog=>observer.observe(dialog,{attributes:true,attributeFilter:['open']}));
    document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerdown',down,true);document.addEventListener('pointerup',up,true);
    document.documentElement.addEventListener('pointerleave',hide);window.addEventListener('blur',hide);document.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);
    return()=>{hide();observer.disconnect();if(el.matches(':popover-open'))el.hidePopover();document.removeEventListener('pointermove',move);document.removeEventListener('pointerdown',down,true);document.removeEventListener('pointerup',up,true);document.documentElement.removeEventListener('pointerleave',hide);window.removeEventListener('blur',hide);document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);};
  },[enabled,loaded]);
  return createPortal(<div ref={ref} popover="manual" className="custom-camera-cursor" aria-hidden="true" style={{width:c.size}}><img src="/assets/images/nikon-camera.png" alt="" draggable="false" onLoad={()=>setLoaded(true)} onError={()=>setLoaded(false)} /></div>,document.body);
}
