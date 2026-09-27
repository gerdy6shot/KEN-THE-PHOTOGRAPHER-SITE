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
import { clampTilt, shutterSamples, cursorConfig } from '../src/cursor-config.js';
import { createShutterAudio } from '../src/shutter-audio.js';
test('cursor rotation is bounded even after a large pointer jump', () => {
  assert.equal(clampTilt(10000),cursorConfig.maxRotation);
  assert.equal(clampTilt(-10000),-cursorConfig.maxRotation);
  assert.equal(clampTilt(0),0);
});
test('preloaded shutter is deterministic, bounded and fades to silence', () => {
  const samples=shutterSamples();assert.deepEqual(samples,shutterSamples());
  assert.ok(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=1));
  assert.ok(Math.abs(samples.at(-1))<0.001);assert.equal(samples.length,7056);
});
test('audio is opt-in; rapid presses overlap; mute stops all sources', async () => {
  let started=0,stopped=0,closed=0,created=0;
  class FakeContext {
    constructor(){created++;this.state='running';}
    createBuffer(){return {copyToChannel(){}};}
    createGain(){return {gain:{value:0},connect(){}};}
    resume(){return Promise.resolve();}
    createBufferSource(){return {connect(){},disconnect(){},start(){started++;},stop(){stopped++;}};}
    close(){closed++;return Promise.resolve();}
  }
  const audio=createShutterAudio(FakeContext);
  await audio.play();assert.equal(created,0);assert.equal(started,0);
  await audio.enable();await Promise.all([audio.play(),audio.play(),audio.play()]);assert.equal(started,3);
  audio.mute();assert.equal(stopped,3);await audio.play();assert.equal(started,3);
  audio.dispose();assert.equal(closed,1);
});
