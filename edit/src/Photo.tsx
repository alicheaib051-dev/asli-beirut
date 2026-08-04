import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Slot } from "./media";
import { kickPulse, easeOutExpo } from "./beat";
import { Grain, Vignette } from "./fx";

/** Camera moves. Every shot gets one so nothing sits still. */
export type Move =
  | "pushIn"
  | "pushOut"
  | "panL"
  | "panR"
  | "tiltUp"
  | "tiltDown"
  | "driftIn"
  | "rollIn";

/** How the shot arrives. */
export type Enter = "cut" | "whipL" | "whipR" | "slideUp" | "zoomIn" | "blurIn";

/** Colour treatments, applied per shot so the film has variety but one voice. */
export type Look = "night" | "cool" | "warm" | "mono" | "crush";

const MOVES: Record<Move, { s: [number, number]; x: [number, number]; y: [number, number]; r: [number, number] }> = {
  pushIn: { s: [1.06, 1.3], x: [0, 0], y: [0, 0], r: [0, 0] },
  pushOut: { s: [1.32, 1.07], x: [0, 0], y: [0, 0], r: [0, 0] },
  panL: { s: [1.24, 1.24], x: [7, -7], y: [0, 0], r: [0, 0] },
  panR: { s: [1.24, 1.24], x: [-7, 7], y: [0, 0], r: [0, 0] },
  tiltUp: { s: [1.26, 1.26], x: [0, 0], y: [6, -6], r: [0, 0] },
  tiltDown: { s: [1.26, 1.26], x: [0, 0], y: [-6, 6], r: [0, 0] },
  driftIn: { s: [1.1, 1.26], x: [-4, 3], y: [2, -2], r: [0, 0] },
  rollIn: { s: [1.34, 1.12], x: [3, -2], y: [0, 0], r: [-2.5, 0.6] },
};

const LOOKS: Record<Look, { filter: string; tint: string; tintBlend: React.CSSProperties["mixBlendMode"] }> = {
  night: {
    filter: "contrast(1.16) saturate(0.72) brightness(0.84)",
    tint: "linear-gradient(180deg, rgba(30,60,110,0.32), rgba(0,0,0,0.15) 55%, rgba(10,20,40,0.4))",
    tintBlend: "soft-light",
  },
  cool: {
    filter: "contrast(1.24) saturate(0.8) brightness(0.82) hue-rotate(-10deg)",
    tint: "linear-gradient(180deg, rgba(40,110,200,0.4), rgba(0,0,0,0.2))",
    tintBlend: "soft-light",
  },
  warm: {
    filter: "contrast(1.14) saturate(1.08) brightness(0.9)",
    tint: "linear-gradient(200deg, rgba(255,150,60,0.34), rgba(0,0,0,0.25) 70%)",
    tintBlend: "soft-light",
  },
  mono: {
    filter: "grayscale(1) contrast(1.4) brightness(0.86)",
    tint: "linear-gradient(180deg, rgba(120,150,190,0.22), rgba(0,0,0,0.3))",
    tintBlend: "soft-light",
  },
  crush: {
    filter: "contrast(1.5) saturate(0.5) brightness(0.7)",
    tint: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(60,90,140,0.28))",
    tintBlend: "overlay",
  },
};

export type PhotoShot = {
  slot: Slot;
  move: Move;
  look: Look;
  enter?: Enter;
  /** Extra crop on top of the move, for reusing one photo as a tighter shot. */
  zoom?: number;
  focus?: [number, number];
  /** How hard the kick pushes the frame. */
  punch?: number;
};

/**
 * A single photographic shot: crop-to-fill, a camera move over its whole life,
 * a colour treatment, an entrance, and a kick-driven punch that keeps the
 * picture breathing with the track.
 */
export const Photo: React.FC<{ shot: PhotoShot; duration: number; g: number }> = ({
  shot,
  duration,
  g,
}) => {
  const local = useCurrentFrame();
  const { slot, move, look, enter = "cut", zoom = 1, punch = 0.05 } = shot;
  const t = duration <= 1 ? 0 : Math.min(1, local / duration);

  const m = MOVES[move];
  const l = LOOKS[look];
  const focus = shot.focus ?? slot.focus ?? [50, 50];

  // entrance
  let enterX = 0;
  let enterY = 0;
  let enterScale = 1;
  let enterBlur = 0;
  if (enter !== "cut") {
    const e = interpolate(local, [0, enter === "blurIn" ? 10 : 7], [0, 1], {
      extrapolateRight: "clamp",
      easing: easeOutExpo,
    });
    const inv = 1 - e;
    if (enter === "whipL") {
      enterX = -inv * 110;
      enterBlur = inv * 26;
    } else if (enter === "whipR") {
      enterX = inv * 110;
      enterBlur = inv * 26;
    } else if (enter === "slideUp") {
      enterY = inv * 95;
    } else if (enter === "zoomIn") {
      enterScale = 1 + inv * 0.9;
      enterBlur = inv * 10;
    } else if (enter === "blurIn") {
      enterBlur = inv * 22;
      enterScale = 1 + inv * 0.12;
    }
  }

  const k = kickPulse(g);
  const scale = interpolate(t, [0, 1], m.s) * zoom * enterScale * (1 + k * punch);
  const x = interpolate(t, [0, 1], m.x) + enterX;
  const y = interpolate(t, [0, 1], m.y) + enterY;
  const rot = interpolate(t, [0, 1], m.r);

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070a", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${x}%, ${y}%) rotate(${rot}deg)`,
          filter: enterBlur > 0.2 ? `blur(${enterBlur}px)` : undefined,
        }}
      >
        <Img
          src={staticFile(slot.file)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focus[0]}% ${focus[1]}%`,
            filter: l.filter,
          }}
        />
      </AbsoluteFill>

      {/* colour treatment */}
      <AbsoluteFill style={{ background: l.tint, mixBlendMode: l.tintBlend, pointerEvents: "none" }} />
      {/* halation in the highlights */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          mixBlendMode: "screen",
          opacity: 0.18 + k * 0.12,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 42%, rgba(120,170,255,0.35), rgba(0,0,0,0) 70%)",
        }}
      />
      <Vignette strength={0.9} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};
