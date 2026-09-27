export const motionConfig = Object.freeze({
  perspective: 1100, depth: 35, pointerTravel: 16,
  pitch: 7, yaw: 12, levitation: 7, period: 5.5,
  response: 0.12, scrollTravel: 58, scrollPitch: 22,
  frameDrift: 28, frameTilt: 3, frameLift: 22,
});
export const smoothing = (delta, response) => 1 - Math.exp(-Math.min(delta, 0.05) / response);
export const motionAllowed = (reduced, finePointer, paused) => !reduced && finePointer && !paused;
