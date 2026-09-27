export const cursorConfig = Object.freeze({
  lag: 0.085, rotationSensitivity: 0.16, maxRotation: 14,
  size: 56, hoverScale: 1.16, pressedScale: 0.88, volume: 0.18,
});
export const clampTilt = value => Math.max(-cursorConfig.maxRotation, Math.min(cursorConfig.maxRotation, value * cursorConfig.rotationSensitivity));
// Precomputed mechanical double-click: no network request or decoding delay.
export function shutterSamples(rate = 44100) {
  const data = new Float32Array(Math.ceil(rate * 0.16));
  let seed = 31;
  for (let i = 0; i < data.length; i++) {
    const t = i / rate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    const burst = Math.exp(-t * 140) + (t >= 0.055 ? 0.65 * Math.exp(-(t - 0.055) * 110) : 0);
    data[i] = (noise * 0.65 + Math.sin(t * 2 * Math.PI * 1350) * 0.35) * burst * Math.min(1, t * 4000);
  }
  return data;
}
