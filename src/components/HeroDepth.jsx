import { useEffect } from 'react';
import { useSceneMotion } from './ParallaxScene';
import { smoothing } from '../motion-config';
export function HeroDepth() {
  const enabled=useSceneMotion();
  useEffect(()=>{
    if(!enabled)return;
    const hero=document.querySelector('.hero');
    const layers=[hero.querySelector('.hero-image'),hero.querySelector('#hero-title'),hero.querySelector('.hero-texture'),hero.querySelector('.hero-foreground')];
    let x=0,y=0,tx=0,ty=0,raf=0,last=0;
    const tick=now=>{raf=0;const a=smoothing(last?(now-last)/1000:1/60,0.16);last=now;x+=(tx-x)*a;y+=(ty-y)*a;
      layers.forEach((el,i)=>{el.style.transform=`translate3d(${x*[-8,5,-4,14][i]}px,${y*[-8,5,-4,14][i]}px,0) scale(${i===0?1.035:1})`;});
      if(Math.abs(tx-x)+Math.abs(ty-y)>0.001)raf=requestAnimationFrame(tick);
    };
    const start=()=>{if(!raf){last=0;raf=requestAnimationFrame(tick);}};
    const move=e=>{if(e.pointerType!=='mouse')return;const r=hero.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*2-1;ty=(e.clientY-r.top)/r.height*2-1;start();};
    const leave=()=>{tx=ty=0;start();};
    layers.forEach(el=>el.style.willChange='transform');hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',leave);
    return()=>{cancelAnimationFrame(raf);hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',leave);layers.forEach(el=>{el.style.transform='';el.style.willChange='';});};
  },[enabled]);
  return null;
}
