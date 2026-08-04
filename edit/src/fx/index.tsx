import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { WIDTH, HEIGHT, ACCENT } from "../theme";
import { beatPulse, kickPulse } from "../beat";

/** Splits the frame into R/G/B copies and pushes them apart. Amount in px. */
export const RGBSplit: React.FC<{
  amount: number;
  angle?: number;
  children: React.ReactNode;
}> = ({ amount, angle = 0, children }) => {
  if (amount < 0.35) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const dx = Math.cos((angle * Math.PI) / 180) * amount;
  const dy = Math.sin((angle * Math.PI) / 180) * amount;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {(
        [
          ["chan-r", dx, dy],
          ["chan-g", 0, 0],
          ["chan-b", -dx, -dy],
        ] as const
      ).map(([id, x, y]) => (
        <AbsoluteFill
          key={id}
          style={{
            filter: `url(#${id})`,
            mixBlendMode: "screen",
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          {children}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

/** Animated film grain. Re-seeds every frame so it never sits still. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.14 }) => {
  const frame = useCurrentFrame();
  const seed = frame % 8;
  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        transform: `translate(${(seed % 3) * 7 - 7}px, ${Math.floor(seed / 3) * 9 - 9}px) scale(1.06)`,
      }}
    >
      <svg width={WIDTH} height={HEIGHT}>
        <rect width={WIDTH} height={HEIGHT} filter="url(#grain-noise)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.8 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 72% 58% at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,${
        strength * 0.55
      }) 78%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

export const Scanlines: React.FC<{ opacity?: number }> = ({ opacity = 0.08 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      opacity,
      mixBlendMode: "multiply",
      backgroundImage:
        "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,1) 3px, rgba(0,0,0,1) 4px)",
    }}
  />
);

/** Cinematic bars that slide in and out. `amount` 0..1. */
export const Letterbox: React.FC<{ amount: number; height?: number }> = ({
  amount,
  height = 210,
}) => (
  <>
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          height,
          background: "#000",
          transform: `translateY(${-height * (1 - amount)}px)`,
        }}
      />
    </AbsoluteFill>
    <AbsoluteFill style={{ pointerEvents: "none", justifyContent: "flex-end" }}>
      <div
        style={{
          height,
          background: "#000",
          transform: `translateY(${height * (1 - amount)}px)`,
        }}
      />
    </AbsoluteFill>
  </>
);

export const Flash: React.FC<{ amount: number; color?: string }> = ({
  amount,
  color = "#ffffff",
}) =>
  amount <= 0.001 ? null : (
    <AbsoluteFill
      style={{ background: color, opacity: Math.min(1, amount), mixBlendMode: "screen" }}
    />
  );

/** Wraps children in a scale/rotate punch driven by the kick pattern. */
export const BeatPunch: React.FC<{
  intensity?: number;
  rotate?: number;
  div?: number;
  useKick?: boolean;
  children: React.ReactNode;
}> = ({ intensity = 0.06, rotate = 0, div = 1, useKick = true, children }) => {
  const frame = useCurrentFrame();
  const p = useKick ? kickPulse(frame) : beatPulse(frame, div);
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${1 + p * intensity}) rotate(${p * rotate}deg)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Handheld-ish shake, seeded so it is deterministic across renders. */
export const Shake: React.FC<{
  amount: number;
  speed?: number;
  children: React.ReactNode;
}> = ({ amount, speed = 1, children }) => {
  const frame = useCurrentFrame();
  const s = Math.floor(frame * speed);
  const x = (random(`sx${s}`) - 0.5) * amount;
  const y = (random(`sy${s}`) - 0.5) * amount;
  const r = (random(`sr${s}`) - 0.5) * amount * 0.05;
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};

/** Warm anamorphic streak that drifts across the frame. */
export const LightLeak: React.FC<{
  progress: number;
  color?: string;
  opacity?: number;
  angle?: number;
}> = ({ progress, color = ACCENT.city, opacity = 0.5, angle = -18 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity }}>
    <div
      style={{
        position: "absolute",
        left: -WIDTH * 0.5 + progress * WIDTH * 1.8,
        top: -HEIGHT * 0.2,
        width: WIDTH * 0.5,
        height: HEIGHT * 1.4,
        transform: `rotate(${angle}deg)`,
        background: `linear-gradient(to right, transparent, ${color}, transparent)`,
        filter: "blur(48px)",
      }}
    />
  </AbsoluteFill>
);

/** Horizontal speed streaks, used on the fast rolling shots. */
export const SpeedLines: React.FC<{ count?: number; amount: number; seedKey?: string }> = ({
  count = 26,
  amount,
  seedKey = "s",
}) => {
  const frame = useCurrentFrame();
  if (amount <= 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: amount }}>
      {Array.from({ length: count }).map((_, i) => {
        const y = random(`${seedKey}y${i}`) * HEIGHT;
        const len = 140 + random(`${seedKey}l${i}`) * 620;
        const speed = 30 + random(`${seedKey}s${i}`) * 90;
        const x = WIDTH + 400 - ((frame * speed + random(`${seedKey}o${i}`) * 2600) % 3200);
        const bright = 0.25 + random(`${seedKey}b${i}`) * 0.75;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: len,
              height: 1 + random(`${seedKey}h${i}`) * 3,
              background: `linear-gradient(to right, transparent, rgba(255,255,255,${bright}), transparent)`,
              filter: "blur(1.5px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Falling rain, angled. Cheap but reads well over the dark grade. */
export const Rain: React.FC<{ count?: number; opacity?: number }> = ({
  count = 90,
  opacity = 0.3,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "screen" }}>
      {Array.from({ length: count }).map((_, i) => {
        const speed = 55 + random(`rs${i}`) * 60;
        const x = random(`rx${i}`) * (WIDTH + 300) - 150;
        const y = ((frame * speed + random(`ro${i}`) * HEIGHT * 2) % (HEIGHT + 300)) - 150;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + y * 0.12,
              top: y,
              width: 1.5,
              height: 30 + random(`rl${i}`) * 60,
              background: "linear-gradient(to bottom, transparent, rgba(210,230,255,0.85))",
              transform: "rotate(7deg)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Slow, subtle exposure breathing so static shots never feel frozen. */
export const useBreath = (frame: number, amount = 0.04) =>
  1 + Math.sin(frame / 24) * amount;

export const exposure = (frame: number, base = 1) =>
  interpolate(kickPulse(frame), [0, 1], [base, base * 1.18]);
