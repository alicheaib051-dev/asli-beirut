import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT, GREY, ACCENT, WIDTH } from "../theme";
import { easeOutExpo } from "../beat";

/** Big display line that slices in from a clipped mask. */
export const SliceTitle: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  color?: string;
  outline?: boolean;
  letterSpacing?: number;
}> = ({ text, delay = 0, size = 190, color = GREY.spec, outline = false, letterSpacing = -4 }) => {
  const frame = useCurrentFrame() - delay;
  const p = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  return (
    <div style={{ overflow: "hidden", lineHeight: 0.92 }}>
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: size,
          letterSpacing,
          textTransform: "uppercase",
          color: outline ? "transparent" : color,
          WebkitTextStroke: outline ? `2.5px ${color}` : undefined,
          transform: `translateY(${(1 - p) * size * 1.05}px) skewY(${(1 - p) * 5}deg)`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Technical read-out line, e.g. "0—100 · 3.9 S". */
export const StatLine: React.FC<{
  label: string;
  value: string;
  delay?: number;
  align?: "left" | "right";
}> = ({ label, value, delay = 0, align = "left" }) => {
  const frame = useCurrentFrame() - delay;
  const p = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        opacity: p,
        transform: `translateX(${(1 - p) * (align === "right" ? 40 : -40)}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 26,
          letterSpacing: 6,
          color: ACCENT.cold,
          opacity: 0.85,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT.heavy,
          fontSize: 68,
          letterSpacing: -1,
          color: GREY.spec,
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
    </div>
  );
};

/** Endless marquee strip. */
export const Ticker: React.FC<{
  text: string;
  speed?: number;
  size?: number;
  color?: string;
  background?: string;
}> = ({ text, speed = 4, size = 44, color = "#05070a", background = GREY.spec }) => {
  const frame = useCurrentFrame();
  const unit = `${text}   •   `;
  const repeated = unit.repeat(14);
  return (
    <div
      style={{
        background,
        overflow: "hidden",
        whiteSpace: "nowrap",
        padding: "10px 0",
      }}
    >
      <div
        style={{
          fontFamily: FONT.cond,
          fontSize: size,
          letterSpacing: 3,
          color,
          textTransform: "uppercase",
          transform: `translateX(${-((frame * speed) % 1200)}px)`,
        }}
      >
        {repeated}
      </div>
    </div>
  );
};

/** Viewfinder furniture — corners, frame counter, crosshair. */
export const Hud: React.FC<{ opacity?: number; label?: string }> = ({
  opacity = 0.55,
  label = "REC",
}) => {
  const frame = useCurrentFrame();
  const tc = `${String(Math.floor(frame / 30)).padStart(2, "0")}:${String(frame % 30).padStart(2, "0")}`;
  const corner = (style: React.CSSProperties) => (
    <div
      style={{
        position: "absolute",
        width: 64,
        height: 64,
        borderColor: GREY.spec,
        ...style,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none", fontFamily: FONT.mono }}>
      {corner({ top: 92, left: 60, borderTop: "3px solid", borderLeft: "3px solid" })}
      {corner({ top: 92, right: 60, borderTop: "3px solid", borderRight: "3px solid" })}
      {corner({ bottom: 92, left: 60, borderBottom: "3px solid", borderLeft: "3px solid" })}
      {corner({ bottom: 92, right: 60, borderBottom: "3px solid", borderRight: "3px solid" })}
      <div
        style={{
          position: "absolute",
          top: 96,
          left: 148,
          color: ACCENT.tail,
          fontSize: 26,
          letterSpacing: 4,
          opacity: frame % 30 < 18 ? 1 : 0.25,
        }}
      >
        ● {label}
      </div>
      <div
        style={{
          position: "absolute",
          top: 96,
          right: 148,
          color: GREY.spec,
          fontSize: 26,
          letterSpacing: 4,
        }}
      >
        {tc}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 148,
          color: GREY.spec,
          fontSize: 24,
          letterSpacing: 4,
        }}
      >
        f/1.4 · 35MM · ISO 3200
      </div>
    </AbsoluteFill>
  );
};

/** Full-width caption bar used for the section titles. */
export const CaptionBar: React.FC<{
  text: string;
  delay?: number;
  y: number;
}> = ({ text, delay = 0, y }) => {
  const frame = useCurrentFrame() - delay;
  const p = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        width: WIDTH,
        display: "flex",
        justifyContent: "center",
        clipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}%)`,
      }}
    >
      <div
        style={{
          background: GREY.spec,
          color: "#05070a",
          fontFamily: FONT.heavy,
          fontSize: 40,
          letterSpacing: 8,
          padding: "12px 34px",
          textTransform: "uppercase",
        }}
      >
        {text}
      </div>
    </div>
  );
};
