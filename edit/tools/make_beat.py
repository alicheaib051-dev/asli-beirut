"""
Generates the original 20-second backing track for the BMW edit.

Everything here is synthesized from scratch (sine/saw/noise + filters), so the
resulting WAV is original work and carries no third-party licence. The tempo and
bar grid exported at the bottom are the same numbers the Remotion timeline uses,
which is what keeps every cut landing on a beat.

    python3 edit/tools/make_beat.py
"""

import json
import os

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 44100
BPM = 144.0
BEAT = 60.0 / BPM          # 0.41666 s
BAR = 4 * BEAT             # 1.66666 s
BARS = 12                  # 12 * 1.66666 = 20.0 s exactly
DUR = BARS * BAR
N = int(round(DUR * SR))

rng = np.random.default_rng(20260804)

OUT_WAV = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "drive.wav")
OUT_JSON = os.path.join(os.path.dirname(__file__), "..", "src", "beat-grid.json")


# ---------------------------------------------------------------- helpers

def t(n):
    return np.arange(n) / SR


def env(n, attack, decay, curve=2.0):
    """Simple percussive AD envelope."""
    a = max(1, int(attack * SR))
    e = np.zeros(n)
    e[:a] = np.linspace(0.0, 1.0, a)
    rest = n - a
    if rest > 0:
        e[a:] = np.exp(-np.linspace(0, curve * 6, rest))
    return e


def adsr(n, a, d, s, r):
    a_n, d_n, r_n = max(1, int(a * SR)), max(1, int(d * SR)), max(1, int(r * SR))
    s_n = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([
        np.linspace(0, 1, a_n),
        np.linspace(1, s, d_n),
        np.full(s_n, s),
        np.linspace(s, 0, r_n),
    ])
    if len(e) < n:
        e = np.pad(e, (0, n - len(e)))
    return e[:n]


def lowpass(x, cutoff, order=4):
    cutoff = min(cutoff, SR / 2 * 0.98)
    sos = butter(order, cutoff / (SR / 2), btype="low", output="sos")
    return sosfilt(sos, x)


def lowpass_var(x, cutoff):
    """One-pole lowpass whose cutoff changes per sample (filter envelope)."""
    a = 1.0 - np.exp(-2.0 * np.pi * np.clip(cutoff, 20, SR / 2 * 0.9) / SR)
    y = np.empty_like(x)
    prev = 0.0
    for i in range(len(x)):
        prev += a[i] * (x[i] - prev)
        y[i] = prev
    return y


def highpass(x, cutoff, order=4):
    sos = butter(order, cutoff / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, x)


def bandpass(x, lo, hi, order=4):
    sos = butter(order, [lo / (SR / 2), min(hi, SR / 2 * 0.98) / (SR / 2)],
                 btype="band", output="sos")
    return sosfilt(sos, x)


def sat(x, drive=2.0):
    return np.tanh(x * drive) / np.tanh(drive)


def noise(n):
    return rng.uniform(-1, 1, n)


def place(buf, sig, at):
    """Mix `sig` into `buf` starting at time `at` (seconds)."""
    i = int(round(at * SR))
    if i >= len(buf):
        return
    k = min(len(sig), len(buf) - i)
    buf[i:i + k] += sig[:k]


def reverb(x, mix=0.3):
    """Cheap Schroeder-ish tail: a few comb delays plus an allpass smear."""
    out = np.zeros(len(x) + SR)
    out[:len(x)] = x
    for delay, fb in ((0.0297, 0.78), (0.0371, 0.75), (0.0411, 0.72), (0.0437, 0.70)):
        d = int(delay * SR)
        buf = np.zeros(len(out))
        buf[d:] = out[:-d]
        for _ in range(6):
            nxt = np.zeros(len(buf))
            nxt[d:] = buf[:-d] * fb
            buf = buf + nxt
        out += buf * 0.25
    out = lowpass(out, 5200)
    return x + mix * out[:len(x)]


# ---------------------------------------------------------------- voices

def kick():
    n = int(0.42 * SR)
    x = t(n)
    f = 48 + 105 * np.exp(-x * 38)                 # pitch drop, 153Hz -> 48Hz
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.30, 1.4)
    click = highpass(noise(n) * env(n, 0.0005, 0.012, 6.0), 1800) * 0.25
    return sat(body * 1.1 + click, 2.2) * 0.95


def sub(freq, dur, glide=1.0):
    n = int(dur * SR)
    x = t(n)
    f = freq * (1 + glide * 0.55 * np.exp(-x * 26))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    y = sat(y, 1.7) * adsr(n, 0.004, 0.05, 0.82, min(0.25, dur * 0.45))
    return lowpass(y, 220) * 0.8


def clap():
    n = int(0.34 * SR)
    body = bandpass(noise(n), 1100, 4200) * env(n, 0.001, 0.16, 2.6)
    out = np.zeros(n)
    for off, g in ((0.0, 1.0), (0.010, 0.8), (0.019, 0.62), (0.029, 0.45)):
        i = int(off * SR)
        seg = bandpass(noise(n), 1200, 5000) * env(n, 0.0005, 0.030, 5.0)
        out[i:] += seg[:n - i] * g
    return (out * 0.55 + body * 0.5) * 0.7


def hat(open_=False):
    dur = 0.16 if open_ else 0.045
    n = int(dur * SR)
    y = highpass(noise(n), 7200) * env(n, 0.0004, dur * 0.7, 3.2)
    return y * (0.30 if open_ else 0.24)


def snare_roll(dur, hits):
    n = int(dur * SR)
    out = np.zeros(n)
    for i in range(hits):
        at = (i / hits) ** 1.25 * dur
        g = 0.35 + 0.65 * (i / max(1, hits - 1))
        s = bandpass(noise(int(0.09 * SR)), 900, 6000) * env(int(0.09 * SR), 0.0005, 0.05, 4.0)
        place(out, s * g * 0.5, at)
    return out


def pluck(freq, dur, level=1.0):
    n = int(dur * SR)
    x = t(n)
    y = np.zeros(n)
    for det, g in ((0.0, 1.0), (0.006, 0.55), (-0.006, 0.55)):
        ph = 2 * np.pi * freq * (1 + det) * x
        y += g * (2 * (ph / (2 * np.pi) % 1.0) - 1.0)     # saw
    e = adsr(n, 0.003, 0.10, 0.28, dur * 0.55)
    y = lowpass_var(y * e, 1600 + 3200 * np.exp(-x * 9))
    return y * 0.16 * level


def pad(freqs, dur, level=1.0):
    n = int(dur * SR)
    x = t(n)
    y = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0.0, 0.004):
            y += np.sin(2 * np.pi * f * (1 + det) * x + rng.uniform(0, 6.28))
            y += 0.3 * np.sin(2 * np.pi * 2 * f * (1 + det) * x)
    y /= (len(freqs) * 4)
    y *= adsr(n, dur * 0.22, dur * 0.15, 0.72, dur * 0.35)
    y = lowpass(y, 1500)
    return y * 0.34 * level


def riser(dur):
    n = int(dur * SR)
    x = t(n)
    sweep = noise(n)
    out = np.zeros(n)
    step = int(0.05 * SR)
    for i in range(0, n - step, step):
        lo = 300 + 5200 * (i / n) ** 1.6
        out[i:i + step] = bandpass(sweep[i:i + step], lo, lo * 1.9)
    ramp = (x / dur) ** 2.0
    return out * ramp * 0.30


def impact():
    n = int(1.6 * SR)
    x = t(n)
    boom = np.sin(2 * np.pi * (58 * np.exp(-x * 2.4)) * x) * env(n, 0.002, 0.9, 1.0)
    crash = highpass(noise(n), 3800) * env(n, 0.001, 1.1, 1.2)
    return sat(boom * 1.2, 1.6) * 0.85 + crash * 0.30


# ---------------------------------------------------------------- arrangement

def bar_time(b, beat=0.0):
    return b * BAR + beat * BEAT


# C minor. i - VI - VII - v  (Cm - Ab - Bb - Gm)
PROG = [
    (65.41, [261.63, 311.13, 392.00]),   # Cm
    (51.91, [246.94, 311.13, 415.30]),   # Ab
    (58.27, [233.08, 293.66, 466.16]),   # Bb
    (49.00, [233.08, 293.66, 392.00]),   # Gm
]

# Cm pentatonic lead, one figure per bar (beat offset, note, length in beats)
LEAD = [
    [(0.0, 622.25, 0.75), (1.0, 523.25, 0.5), (1.75, 466.16, 0.75), (3.0, 392.00, 1.0)],
    [(0.0, 415.30, 0.75), (1.5, 466.16, 0.5), (2.0, 523.25, 1.0), (3.5, 415.30, 0.5)],
    [(0.0, 466.16, 0.75), (1.0, 523.25, 0.5), (2.0, 622.25, 1.0), (3.25, 523.25, 0.75)],
    [(0.0, 392.00, 1.0), (1.5, 466.16, 0.5), (2.5, 415.30, 1.5)],
]

KICK_PATTERN = [0.0, 0.75, 2.0, 2.5, 3.5]        # in beats within a bar
HAT_8TH = [i * 0.5 for i in range(8)]
HAT_16TH = [i * 0.25 for i in range(16)]

mix_drums = np.zeros(N)
mix_bass = np.zeros(N)
mix_music = np.zeros(N)
mix_fx = np.zeros(N)

DROP_A = range(2, 6)
BREAK = range(6, 7)
DROP_B = range(7, 9)
PEAK = range(9, 11)
OUTRO = range(11, 12)

drum_bars = set(DROP_A) | set(DROP_B) | set(PEAK) | set(OUTRO)

for b in range(BARS):
    root, chord = PROG[b % 4]
    b_t = bar_time(b)

    # --- pads run almost the whole way through
    if b < BARS:
        lvl = 0.55 if b in drum_bars else 0.72
        place(mix_music, pad(chord, BAR * 1.05, lvl), b_t)

    # --- drums
    if b in drum_bars:
        for kb in KICK_PATTERN:
            place(mix_drums, kick(), bar_time(b, kb))
        for cb in (1.0, 3.0):
            place(mix_drums, clap(), bar_time(b, cb))
        pattern = HAT_16TH if (b in PEAK or b in (5, 8, 11)) else HAT_8TH
        for i, hb in enumerate(pattern):
            g = 1.0 if i % 2 == 0 else 0.62
            place(mix_drums, hat() * g, bar_time(b, hb))
        for ob in (1.5, 3.5):
            place(mix_drums, hat(open_=True) * 0.8, bar_time(b, ob))

    # --- 808
    if b in drum_bars:
        place(mix_bass, sub(root, BEAT * 2.6), b_t)
        place(mix_bass, sub(root, BEAT * 1.2, glide=0.4), bar_time(b, 2.5))
    elif b < 2 or b in BREAK:
        place(mix_bass, sub(root, BEAT * 3.4, glide=0.2) * 0.55, b_t)

    # --- lead
    if b >= 2:
        figure = LEAD[b % 4]
        lvl = 1.0 if (b in DROP_B or b in PEAK) else 0.7
        for beat_off, note, length in figure:
            place(mix_music, pluck(note, length * BEAT * 1.6, lvl), bar_time(b, beat_off))
            if b in PEAK:      # octave doubling at the peak
                place(mix_music, pluck(note * 2, length * BEAT * 1.2, 0.45),
                      bar_time(b, beat_off))

# --- transitions
place(mix_fx, riser(BAR * 1.0), bar_time(1))          # into drop A
place(mix_fx, riser(BAR * 0.85), bar_time(6, 0.6))    # out of the break
place(mix_fx, snare_roll(BAR * 0.7, 14), bar_time(6, 1.2))
place(mix_fx, snare_roll(BAR * 0.5, 12), bar_time(8, 2.0))
place(mix_fx, impact() * 0.9, bar_time(2))
place(mix_fx, impact(), bar_time(7))
place(mix_fx, impact() * 1.0, bar_time(9))
place(mix_fx, impact() * 1.05, bar_time(11))

# --- vinyl / air bed
vinyl = lowpass(highpass(noise(N), 400), 9000) * 0.012
crackle = np.zeros(N)
for at in rng.uniform(0, DUR - 0.1, 140):
    place(crackle, noise(int(0.004 * SR)) * rng.uniform(0.02, 0.08), at)
mix_fx += vinyl + highpass(crackle, 2000)

# ---------------------------------------------------------------- mixdown

mix_music = reverb(mix_music, mix=0.28)
mix_fx = reverb(mix_fx, mix=0.20)

# duck the music under every kick so the low end stays clean
duck = np.ones(N)
for b in range(BARS):
    if b not in drum_bars:
        continue
    for kb in KICK_PATTERN:
        i = int(bar_time(b, kb) * SR)
        k = int(0.19 * SR)
        if i + k <= N:
            duck[i:i + k] = np.minimum(duck[i:i + k],
                                       0.55 + 0.45 * (1 - np.exp(-np.linspace(0, 4, k))))

mono = (mix_drums * 0.95
        + mix_bass * 1.05
        + mix_music * 0.90 * duck
        + mix_fx * 0.75)

mono = highpass(mono, 26)
mono = sat(mono * 0.72, 0.85)   # gentle glue only — keep the transients alive

# slight stereo width on everything above the bass
side = bandpass(mono, 260, 12000) * 0.16
left = mono + side
right = mono - side

# global fade in/out so the loop has no clicks
fade_in = int(0.35 * SR)
fade_out = int(1.6 * SR)
for ch in (left, right):
    ch[:fade_in] *= np.linspace(0, 1, fade_in)
    ch[-fade_out:] *= np.linspace(1, 0, fade_out) ** 1.5

stereo = np.stack([left, right], axis=1)
stereo /= np.max(np.abs(stereo)) / 0.94

os.makedirs(os.path.dirname(OUT_WAV), exist_ok=True)
from scipy.io import wavfile
wavfile.write(os.path.abspath(OUT_WAV), SR, (stereo * 32767).astype(np.int16))

# ---------------------------------------------------------------- beat grid

FPS = 30
grid = {
    "bpm": BPM,
    "fps": FPS,
    "beatFrames": FPS * BEAT,
    "barFrames": FPS * BAR,
    "durationInFrames": int(round(DUR * FPS)),
    "sections": {
        "intro": [0, 2],
        "dropA": [2, 6],
        "break": [6, 7],
        "dropB": [7, 9],
        "peak": [9, 11],
        "outro": [11, 12],
    },
    "accents": [bar_time(b) * FPS for b in (2, 7, 9, 11)],
}
with open(os.path.abspath(OUT_JSON), "w") as f:
    json.dump(grid, f, indent=2)

print(f"wrote {os.path.abspath(OUT_WAV)}  {DUR:.2f}s  {stereo.shape[0]} frames")
print(f"wrote {os.path.abspath(OUT_JSON)}")
