import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import "./fonts";
import { FilterDefs } from "./fx/Filters";
import { Flash, Letterbox, RGBSplit, Scanlines, Shake, SpeedLines, LightLeak } from "./fx";
import { Photo, PhotoShot } from "./Photo";
import { SLOTS } from "./media";
import { CaptionBar, Hud, SliceTitle, StatLine, Ticker } from "./type";
import { DURATION, HEIGHT, WIDTH, FONT, GREY, ACCENT } from "./theme";
import { bar, kickPulse, beatPulse, easeOutExpo } from "./beat";

/* -------------------------------------------------------------------------
   The cut list. Every `from` sits on a bar or half-bar of the 144 bpm grid,
   which is what welds the picture to the track. 16 shots out of 10 photos —
   the repeats come back tighter and on a different move, the way a real edit
   reuses its best frames.
   ------------------------------------------------------------------------- */

type Cut = { from: number; duration: number; shot: PhotoShot };

const cuts: Cut[] = [
  // ---- bars 0–2 : cold open --------------------------------------------
  {
    from: bar(0),
    duration: bar(2),
    shot: { slot: SLOTS.hero, move: "pushIn", look: "night", enter: "blurIn", punch: 0.02 },
  },

  // ---- bars 2–6 : first drop -------------------------------------------
  {
    from: bar(2),
    duration: bar(1),
    shot: { slot: SLOTS.front, move: "pushOut", look: "crush", enter: "zoomIn", punch: 0.07 },
  },
  {
    from: bar(3),
    duration: bar(1),
    shot: { slot: SLOTS.side, move: "panR", look: "cool", enter: "whipL" },
  },
  {
    from: bar(4),
    duration: bar(0.5),
    shot: { slot: SLOTS.wheel, move: "pushIn", look: "night", enter: "zoomIn", punch: 0.08 },
  },
  {
    from: bar(4.5),
    duration: bar(0.5),
    shot: { slot: SLOTS.lamp, move: "tiltDown", look: "crush", enter: "cut", punch: 0.08 },
  },
  {
    from: bar(5),
    duration: bar(1),
    shot: { slot: SLOTS.rolling, move: "panL", look: "cool", enter: "whipR" },
  },

  // ---- bar 6 : the break ------------------------------------------------
  {
    from: bar(6),
    duration: bar(1),
    shot: { slot: SLOTS.detail, move: "driftIn", look: "mono", enter: "blurIn", punch: 0.015 },
  },

  // ---- bars 7–9 : second drop ------------------------------------------
  {
    from: bar(7),
    duration: bar(0.5),
    shot: { slot: SLOTS.rear, move: "rollIn", look: "warm", enter: "zoomIn", punch: 0.08 },
  },
  {
    from: bar(7.5),
    duration: bar(0.5),
    shot: { slot: SLOTS.interior, move: "pushIn", look: "night", enter: "whipL" },
  },
  {
    from: bar(8),
    duration: bar(0.5),
    shot: { slot: SLOTS.exhaust, move: "tiltUp", look: "crush", enter: "cut", punch: 0.09 },
  },
  {
    from: bar(8.5),
    duration: bar(0.5),
    shot: { slot: SLOTS.side, move: "pushOut", look: "cool", enter: "whipR", zoom: 1.45 },
  },

  // ---- bars 9–11 : peak, cutting on every half bar ----------------------
  {
    from: bar(9),
    duration: bar(0.5),
    shot: { slot: SLOTS.front, move: "pushIn", look: "crush", enter: "zoomIn", zoom: 1.35, punch: 0.1 },
  },
  {
    from: bar(9.5),
    duration: bar(0.5),
    shot: { slot: SLOTS.wheel, move: "panL", look: "night", enter: "cut", zoom: 1.3, punch: 0.1 },
  },
  {
    from: bar(10),
    duration: bar(0.5),
    shot: { slot: SLOTS.lamp, move: "pushOut", look: "warm", enter: "whipL", zoom: 1.45, punch: 0.1 },
  },
  {
    from: bar(10.5),
    duration: bar(0.5),
    shot: { slot: SLOTS.rolling, move: "tiltDown", look: "cool", enter: "cut", zoom: 1.25, punch: 0.1 },
  },

  // ---- bars 11–12 : land it --------------------------------------------
  {
    from: bar(11),
    duration: bar(1),
    shot: { slot: SLOTS.hero, move: "pushOut", look: "night", enter: "blurIn", punch: 0.03 },
  },
];

/** Whole-frame hits on the four arrangement accents. */
const ACCENTS: [number, number][] = [
  [bar(2), 0.85],
  [bar(7), 0.8],
  [bar(9), 0.85],
  [bar(11), 0.32],
];

export const Edit: React.FC = () => {
  const frame = useCurrentFrame();
  const k = kickPulse(frame);

  // chromatic aberration tracks the arrangement: none in the open, a little
  // through the first drop, off in the break, hardest at the peak.
  const splitBase =
    frame < bar(2) ? 0 : frame < bar(6) ? 6 : frame < bar(7) ? 0 : frame < bar(9) ? 9 : 15;
  const split = k * splitBase * (frame >= bar(11) ? 0.3 : 1);

  const accent = ACCENTS.reduce((acc, [f, amp]) => {
    const d = frame - f;
    if (d < 0 || d > 9) return acc;
    return Math.max(acc, interpolate(d, [0, 9], [amp, 0], { extrapolateRight: "clamp" }));
  }, 0);

  const shake =
    frame < bar(2) ? 0 : frame >= bar(9) && frame < bar(11) ? 9 + k * 24 : k * 6;

  // hard fades top and tail
  const fade = Math.min(
    interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [DURATION - 26, DURATION - 2], [1, 0], { extrapolateLeft: "clamp" }),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <FilterDefs />
      <Audio src={staticFile("audio/drive.wav")} />

      <AbsoluteFill style={{ opacity: fade }}>
        <RGBSplit amount={split} angle={12}>
          <Shake amount={shake}>
            {cuts.map((c) => (
              <Sequence
                key={`${c.shot.slot.id}-${c.from}`}
                from={c.from}
                durationInFrames={c.duration}
                name={`${c.shot.slot.id} @ bar ${c.from / 50}`}
              >
                <Photo shot={c.shot} duration={c.duration} g={frame} />
              </Sequence>
            ))}
          </Shake>
        </RGBSplit>

        {/* speed streaks only where the cutting is fastest */}
        <Sequence from={bar(9)} durationInFrames={bar(2)} name="Streaks">
          <SpeedLines amount={0.45} count={20} />
        </Sequence>
        <Sequence from={bar(5)} durationInFrames={bar(1)} name="Leak">
          <Leak />
        </Sequence>

        {/* ---------------- type ---------------- */}
        <Sequence durationInFrames={bar(2)} name="Open title">
          <OpenTitle />
        </Sequence>
        <Sequence from={bar(3)} durationInFrames={bar(2)} name="Specs">
          <Specs />
        </Sequence>
        <Sequence from={bar(6)} durationInFrames={bar(1)} name="Break card">
          <BreakCard />
        </Sequence>
        <Sequence from={bar(9)} durationInFrames={bar(2)} name="Peak type">
          <PeakType g={frame} />
        </Sequence>
        <Sequence from={bar(11)} durationInFrames={bar(1)} name="End card">
          <EndCard />
        </Sequence>

        <Letterbox
          amount={interpolate(
            frame,
            [bar(2) - 8, bar(2), bar(6), bar(6.6), bar(11) - 10, bar(11)],
            [1, 0.24, 0.24, 1, 1, 0.7],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}
          height={168}
        />
        <Scanlines opacity={0.045} />
        <Flash amount={accent} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Leak: React.FC = () => {
  const frame = useCurrentFrame();
  return <LightLeak progress={interpolate(frame, [0, 50], [0, 1])} opacity={0.4} />;
};

const OpenTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [76, 96], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.9))" }}>
          <SliceTitle text="Grey" size={300} delay={16} />
          <SliceTitle text="Matter" size={170} delay={26} outline />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ padding: 92, justifyContent: "flex-start" }}>
        <div
          style={{
            marginTop: 26,
            opacity: interpolate(frame, [6, 26], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ fontFamily: FONT.mono, fontSize: 26, letterSpacing: 10, color: GREY.light }}>
            REEL 01 — 00:00:20:00
          </div>
          <div
            style={{
              fontFamily: FONT.cond,
              fontSize: 44,
              letterSpacing: 6,
              color: GREY.spec,
              marginTop: 8,
              textTransform: "uppercase",
            }}
          >
            Grey BMW / night plates
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Specs: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = Math.min(
    interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [76, 96], [1, 0], { extrapolateLeft: "clamp" }),
  );
  return (
    <AbsoluteFill style={{ opacity: fade, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 88, top: 320 }}>
        <StatLine label="PAINT" value="NARDO" delay={4} />
      </div>
      <div style={{ position: "absolute", right: 88, top: 540, textAlign: "right" }}>
        <StatLine label="0—100" value="3.9 S" delay={14} align="right" />
      </div>
      <div style={{ position: "absolute", left: 88, bottom: 420 }}>
        <StatLine label="TWIN TURBO" value="510 HP" delay={24} />
      </div>
      <Hud opacity={0.34 * fade} />
    </AbsoluteFill>
  );
};

const BreakCard: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = Math.min(
    interpolate(frame, [2, 16], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [34, 48], [1, 0], { extrapolateLeft: "clamp" }),
  );
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <CaptionBar text="Night shift" delay={4} y={HEIGHT / 2 - 60} />
    </AbsoluteFill>
  );
};

const PeakType: React.FC<{ g: number }> = ({ g }) => {
  const frame = useCurrentFrame();
  const words = ["GREY", "MATTER", "ONE", "TAKE"];
  const idx = Math.min(words.length - 1, Math.floor(frame / 25));
  const pulse = beatPulse(g, 1, 5);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        mixBlendMode: "difference",
        opacity: interpolate(frame, [82, 100], [1, 0], { extrapolateLeft: "clamp" }),
      }}
    >
      <div style={{ transform: `scale(${1 + pulse * 0.1}) rotate(${idx % 2 ? 1.6 : -1.6}deg)` }}>
        {/* delay tracks the word index so each swap re-slices in */}
        <SliceTitle text={words[idx]} size={230} delay={idx * 25} letterSpacing={-8} />
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [4, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)", opacity: p }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", opacity: p }}>
          <SliceTitle text="Grey Matter" size={122} delay={6} letterSpacing={-2} />
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 26,
              letterSpacing: 11,
              color: ACCENT.cold,
              marginTop: 20,
            }}
          >
            CUT TO 144 BPM · ORIGINAL SCORE
          </div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 300, left: 0, width: WIDTH, opacity: p }}>
        <Ticker text="grey matter · 20 seconds" speed={4} size={36} />
      </div>
    </AbsoluteFill>
  );
};

export const EDIT_DURATION = DURATION;
