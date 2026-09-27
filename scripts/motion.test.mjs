import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothing, motionAllowed, motionConfig } from '../src/motion-config.js';
test('reduced motion, touch and pause each prevent decorative motion', () => {
  for (const reduced of [true, false]) for (const fine of [true, false]) for (const paused of [true, false]) {
    assert.equal(motionAllowed(reduced, fine, paused), !reduced && fine && !paused);
  }
});
test('lerp has consistent elapsed-time response at 60 and 120Hz', () => {
  const run = fps => { let value=0; for(let i=0;i<fps;i++) value+=(1-value)*smoothing(1/fps,motionConfig.response); return value; };
  assert.ok(Math.abs(run(60)-run(120))<1e-10);
  assert.ok(smoothing(5,motionConfig.response)<0.35, 'returning from a background tab must not jump');
});
