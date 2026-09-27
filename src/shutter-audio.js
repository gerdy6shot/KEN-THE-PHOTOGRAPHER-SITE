import { cursorConfig, shutterSamples } from './cursor-config.js';
const samples = shutterSamples();
export function createShutterAudio(Context = window.AudioContext || window.webkitAudioContext) {
  let context, buffer, gain, enabled = false;
  const sources = new Set();
  return {
    async enable() {
      if (!Context) throw new Error('Web Audio unavailable');
      if (!context) {
        context = new Context(); buffer = context.createBuffer(1, samples.length, 44100);
        buffer.copyToChannel(samples, 0); gain = context.createGain(); gain.gain.value = cursorConfig.volume; gain.connect(context.destination);
      }
      await context.resume(); enabled = true;
    },
    mute() { enabled = false; for (const source of sources) source.stop(); sources.clear(); },
    async play() {
      if (!enabled || !context) return;
      if (context.state === 'suspended') await context.resume();
      if (!enabled) return;
      const source = context.createBufferSource(); source.buffer = buffer; source.connect(gain);
      sources.add(source); source.onended = () => { sources.delete(source); source.disconnect(); }; source.start();
    },
    dispose() { this.mute(); if (context && context.state !== 'closed') void context.close(); },
  };
}
