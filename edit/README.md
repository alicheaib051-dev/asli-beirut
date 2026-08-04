# Grey Matter — 20-second BMW edit

A beat-synced vertical edit (1080×1920, 30 fps, 20.00 s) built with Remotion.

The whole thing is self-contained: the backing track is synthesized from
scratch, the fonts are inlined, and nothing is fetched at render time.

## Drop your photos in

The edit ships with ten numbered placeholder frames so it renders end to end
before any photography exists. Replace any file in `public/media/` with your own
image, **keeping the same filename**, and the timeline picks it up — no code
changes.

| File | What the shot wants |
| --- | --- |
| `shot-01.jpg` | Hero / wide — front three-quarter, whole car in frame. Opens and closes the film. |
| `shot-02.jpg` | Front, head on, low angle |
| `shot-03.jpg` | Full side profile |
| `shot-04.jpg` | Wheel + arch, close |
| `shot-05.jpg` | Headlight, tight |
| `shot-06.jpg` | Rear three-quarter, taillights lit |
| `shot-07.jpg` | Detail — badge, grille or mirror |
| `shot-08.jpg` | Rolling shot, or a pan |
| `shot-09.jpg` | Interior — wheel, dash or seats |
| `shot-10.jpg` | Exhaust / rear diffuser |

Shoot or crop **portrait**; anything else is centre-cropped to fill. 1080×1920 or
larger is ideal — the camera moves push in up to ~1.5×, so bigger source images
stay sharp. If a subject sits high or low in the frame and the crop clips it,
adjust that slot's `focus` in `src/media.ts` (an `object-position` percentage
pair).

Ten photos become sixteen shots — the best frames come back later in the edit,
tighter and on a different move.

## Render

```bash
npm install
npm run beat          # regenerate the score (optional, it's committed)
npm run dev           # Remotion Studio, scrub the timeline
npm run build         # → out/bmw-edit.mp4
```

On a headless box, point Remotion at a Chromium you already have rather than
letting it download one:

```bash
npx remotion render src/index.ts Edit out/bmw-edit.mp4 \
  --browser-executable=/path/to/headless_shell --concurrency=3
```

## How it's cut

The score runs at **144 BPM**, which puts a bar at exactly 50 frames and makes
12 bars 20.00 seconds on the nose. Every cut in `src/Edit.tsx` is placed with
`bar(n)`, so the picture is welded to the track by construction rather than by
eye.

| Bars | Frames | Section |
| --- | --- | --- |
| 0–2 | 0–100 | Cold open — hero shot, slow push, title |
| 2–6 | 100–300 | First drop — cuts on the bar, then the half bar |
| 6–7 | 300–350 | Break — one mono shot, full letterbox |
| 7–9 | 350–450 | Second drop — half-bar cutting |
| 9–11 | 450–550 | Peak — half-bar cuts, hardest grade and shake |
| 11–12 | 550–600 | End card, fade to black |

`kickPulse()` in `src/beat.ts` reproduces the track's actual kick pattern
(`0, 0.75, 2, 2.5, 3.5` beats), and everything reactive — the frame punch,
chromatic aberration, shake, halation — is driven off that one envelope, so the
effects move together instead of each drifting on its own clock.

## Layout

```
src/
  Edit.tsx        the cut list and all overlay type
  Photo.tsx       one shot: crop, camera move, grade, entrance, punch
  media.ts        the ten photo slots
  beat.ts         bar/beat maths and the kick envelope
  beat-grid.json  written by tools/make_beat.py — tempo, sections, accents
  fx/             grain, vignette, letterbox, RGB split, shake, leaks, streaks
  type/           titles, stat lines, ticker, viewfinder furniture
tools/
  make_beat.py         synthesizes public/audio/drive.wav
  make_placeholders.py writes the ten placeholder frames
  embed_fonts.py       inlines public/fonts/*.woff2 into src/font-css.ts
```

## The music

`tools/make_beat.py` builds the track from sine, saw and noise oscillators plus
Butterworth filters — kick, 808, clap, hats, plucks, pads, risers, impacts and a
vinyl bed, arranged over the same 12 bars the edit uses. It is original output
with no third-party licence attached, and it is deliberately mixed with an arc:
quiet open, two drops, a break, and a peak around bar 9.

Swapping in a different track means matching `BPM` in `tools/make_beat.py` (or
`src/beat-grid.json`) to the new tempo — the cut list is expressed in bars, so
it re-times itself.
