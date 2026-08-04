import { interpolate, Easing } from "remotion";
import grid from "./beat-grid.json";

export const BPM = grid.bpm;
export const BEAT = grid.beatFrames; // 12.5 frames @ 144bpm / 30fps
export const BAR = grid.barFrames; // 50 frames

/** Frame at which bar `b` (0-indexed) starts, optionally offset by beats. */
export const bar = (b: number, beats = 0) => b * BAR + beats * BEAT;

/** Position inside the current beat, 0 → 1. */
export const beatPhase = (frame: number, div = 1) => {
  const len = BEAT / div;
  return (frame % len) / len;
};

/**
 * A percussive 1 → 0 envelope that retriggers every beat (or every `div`th of a
 * beat). This is what drives every punch, flash and shake in the edit, so all of
 * them move together.
 */
export const beatPulse = (frame: number, div = 1, curve = 3.2) =>
  Math.pow(1 - beatPhase(frame, div), curve);

/** Same, but only on the kick pattern the track actually plays. */
const KICKS = [0, 0.75, 2, 2.5, 3.5];

export const kickPulse = (frame: number, curve = 3.4) => {
  const inBar = frame % BAR;
  let sinceFrames = BAR;
  for (const k of KICKS) {
    const d = inBar - k * BEAT;
    if (d >= 0) sinceFrames = Math.min(sinceFrames, d);
  }
  const sinceBeats = sinceFrames / BEAT;
  return Math.pow(Math.max(0, 1 - sinceBeats / 1.1), curve);
};

/** Ease a value in and out at the edges of a clip. */
export const edgeFade = (frame: number, duration: number, len = 6) =>
  Math.min(
    interpolate(frame, [0, len], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [duration - len, duration], [1, 0], {
      extrapolateLeft: "clamp",
    }),
  );

export const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOutQuint = Easing.bezier(0.83, 0, 0.17, 1);

export default grid;
