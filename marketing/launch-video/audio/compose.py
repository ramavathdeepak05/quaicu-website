"""Compose the score and sound effects for one cut.

usage: python3 audio/compose.py --cues .work/<cut>/cues.json --out score.wav

Music and sound effects are synthesised here from sine, saw and noise
sources, so they are original and safe to use in paid ads. The cue file comes
from the stage (window.__meta): scene boundaries, every on-screen event
(rows copied, approvals, the logo hit) and where each voiceover line sits.
Music runs at 120 BPM in D minor and resolves to F major on the end card; it
goes quiet for "Introducing", drops on the logo, and ducks under the voice.
Loudness normalisation happens later in render.mjs (ffmpeg loudnorm, -14 LUFS).
"""

import argparse
import json
import os
import subprocess
import wave

import numpy as np
from scipy import signal

SR = 48000
BPM = 120
BEAT = 60 / BPM
BAR = BEAT * 4

rng = np.random.default_rng(2041)

# ---------------------------------------------------------------- helpers


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def db(x):
    return 10 ** (x / 20)


def secs(n):
    return np.arange(n) / SR


def sos_filter(x, kind, fc, order=2):
    nyq = SR / 2
    if isinstance(fc, (list, tuple)):
        wn = [f / nyq for f in fc]
    else:
        wn = min(fc / nyq, 0.99)
    sos = signal.butter(order, wn, btype=kind, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def lp(x, fc, order=2):
    return sos_filter(x, "lowpass", fc, order)


def hp(x, fc, order=2):
    return sos_filter(x, "highpass", fc, order)


def bp(x, lo, hi, order=2):
    return sos_filter(x, "bandpass", [lo, hi], order)


def biquad(x, kind, f0, gain_db=0.0, q=0.707):
    """RBJ cookbook peaking / shelving EQ."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w), np.sin(w)
    alpha = sw / (2 * q)
    if kind == "peak":
        b = [1 + alpha * A, -2 * cw, 1 - alpha * A]
        a = [1 + alpha / A, -2 * cw, 1 - alpha / A]
    elif kind == "highshelf":
        r = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) + (A - 1) * cw + r), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - r)]
        a = [(A + 1) - (A - 1) * cw + r, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - r]
    else:
        raise ValueError(kind)
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=0)


def noise(n):
    return rng.standard_normal(n)


def exp_env(n, decay, attack=0.002):
    t = secs(n)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def saw(freq, n, harmonics=18, phase=0.0):
    """Band-limited saw built from its first harmonics."""
    t = secs(n)
    out = np.zeros(n)
    for k in range(1, harmonics + 1):
        if freq * k > 12000:
            break
        out += np.sin(2 * np.pi * freq * k * t + phase * k) / k
    return out * 0.55


def pan2(x, pan):
    """Equal-power pan of a mono signal; pan in -1..1."""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


class Bus:
    def __init__(self, n):
        self.buf = np.zeros((n, 2))

    def add(self, at, sig, gain=1.0, pan=0.0):
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        i = int(round(at * SR))
        if i < 0:
            sig = sig[-i:]
            i = 0
        j = min(len(self.buf), i + len(sig))
        if j > i:
            self.buf[i:j] += sig[: j - i] * gain


def smooth(curve, width, rate=SR):
    k = max(1, int(width * rate))
    win = np.hanning(k * 2 + 1)
    win /= win.sum()
    pad = np.concatenate([np.full(k, curve[0]), curve, np.full(k, curve[-1])])
    return np.convolve(pad, win, mode="same")[k:-k]


# ---------------------------------------------------------------- instruments


def kick(vel=1.0):
    n = int(0.45 * SR)
    t = secs(n)
    f = 46 + 70 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = lp(noise(n), 3000) * np.exp(-t / 0.004) * 0.25
    return (body + click) * vel


def bass_note(freq, dur):
    n = int(dur * SR)
    t = secs(n)
    x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t)
    x += 0.12 * saw(freq, n, 6)
    env = np.clip(t / 0.006, 0, 1) * (0.35 + 0.65 * np.exp(-t / 0.12))
    env *= np.clip((dur - t) / 0.03, 0, 1)
    return lp(x * env, 900)


def hat(vel=1.0, length=0.05):
    n = int(length * SR)
    x = lp(hp(noise(n), 6500, 2), 11000, 2) * exp_env(n, length / 3.5, 0.0005)
    return x * vel


def clap(vel=1.0):
    n = int(0.22 * SR)
    t = secs(n)
    # three quick bursts then a short tail, like hands
    env = sum(np.exp(-np.maximum(0, t - d) / 0.006) * (t >= d) for d in (0, 0.011, 0.023)) * 0.5
    env += np.exp(-np.maximum(0, t - 0.03) / 0.07) * (t >= 0.03) * 0.6
    x = bp(noise(n), 900, 5200, 2) * env
    return x * vel


def snare(vel=1.0):
    n = int(0.18 * SR)
    t = secs(n)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04) * 0.6
    rattle = bp(noise(n), 1200, 7000, 2) * np.exp(-t / 0.06)
    return (body + rattle) * vel


def roll(length):
    """Snare roll that speeds up and swells into a drop."""
    out = np.zeros(int(length * SR) + int(0.2 * SR))
    t = 0.0
    while t < length:
        u = t / length
        hit = snare(0.25 + 0.75 * u ** 1.6)
        i = int(t * SR)
        out[i:i + len(hit)] += hit[: len(out) - i]
        t += BEAT / (2 if u < 0.4 else 4 if u < 0.75 else 8)
    return out


def crash(vel=1.0, length=1.8):
    n = int(length * SR)
    x = hp(noise(n), 3800, 2) * exp_env(n, length / 4.5, 0.002)
    return x * vel


def pluck(freq, vel=1.0):
    n = int(0.6 * SR)
    t = secs(n)
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t + 0.4) + 0.12 * np.sin(2 * np.pi * freq * 3 * t)
    bite = (0.25 * np.sin(2 * np.pi * freq * 4 * t) + 0.15 * np.sin(2 * np.pi * freq * 6 * t)) * np.exp(-t / 0.03)
    return (x + bite) * exp_env(n, 0.16, 0.003) * vel


def bell(freq, dur=0.9, vel=1.0):
    n = int(dur * SR)
    t = secs(n)
    x = (
        np.sin(2 * np.pi * freq * t)
        + 0.45 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.12)
        + 0.25 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t / 0.05)
    )
    return x * exp_env(n, dur / 3.2, 0.002) * vel


def click(vel=1.0, fc=3500):
    n = int(0.012 * SR)
    return bp(noise(n), fc * 0.6, fc * 1.6) * exp_env(n, 0.0025, 0.0003) * vel


def whoosh(length=0.6, peak=0.75, lo=300, hi=5000, vel=1.0):
    """Filtered noise swell; the band rises toward the peak then falls."""
    n = int(length * SR)
    t = secs(n) / length
    env = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) / (1 - peak) * 4))
    x = noise(n)
    # time-varying one-pole low-pass, block-wise
    out = np.zeros(n)
    z = 0.0
    blk = 256
    for s in range(0, n, blk):
        u = min(1.0, (s / n) / peak) if s / n < peak else max(0.0, 1 - (s / n - peak) / (1 - peak))
        fc = lo + (hi - lo) * u
        a = np.exp(-2 * np.pi * fc / SR)
        seg = x[s : s + blk]
        y, zf = signal.lfilter([1 - a], [1, -a], seg, zi=[z * a])
        z = y[-1]
        out[s : s + blk] = y
    out = hp(out, 120)
    return out * env * vel * 2.2


def sub_drop(vel=1.0, length=1.6):
    n = int(length * SR)
    t = secs(n)
    f = 34 + 60 * np.exp(-t / 0.18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * exp_env(n, length / 3.0, 0.004) * vel


def riser(length):
    n = int(length * SR)
    t = secs(n) / length
    f = 180 * 2 ** (t * 2.5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) * 0.25 + np.sin(ph * 2.01) * 0.12
    nz = hp(noise(n), 1500) * 0.5
    return (tone + nz) * (t ** 2.4)


def buzz(freq=110, length=0.24):
    n = int(length * SR)
    t = secs(n)
    x = signal.square(2 * np.pi * freq * t, 0.5) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t))
    x = lp(x, 1400)
    return x * np.clip(t / 0.005, 0, 1) * np.clip((length - t) / 0.04, 0, 1)


def reverb_ir(length=2.2, decay=0.55, seed=7):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    t = secs(n)
    env = np.exp(-t / decay) * np.clip(t / 0.01, 0, 1)
    ir = np.stack([r.standard_normal(n) * env, r.standard_normal(n) * env], axis=1)
    ir = lp(ir, 5200)
    ir[:, 0] /= np.sqrt(np.sum(ir[:, 0] ** 2))
    ir[:, 1] /= np.sqrt(np.sum(ir[:, 1] ** 2))
    return ir


# ---------------------------------------------------------------- harmony

# Pad voicings (MIDI) and bass roots: Dm9, Bbmaj9, Fmaj9, C6/9 (2 bars each).
CHORDS = [
    ([50, 53, 57, 60, 64], 38),
    ([50, 53, 57, 60, 65], 34),
    ([53, 57, 60, 64, 67], 41),
    ([52, 55, 57, 60, 62], 36),
]
RESOLVE = ([53, 57, 60, 64, 67, 72], 41)  # F major 9, end card

SECTION = {
    "hook": "intro",
    "tension": "tension",
    "reveal": "drop",
    "dash": "drive",
    "connect": "drive",
    "automate": "drive",
    "pipeline": "drive",
    "live": "drive",
    "engage": "lift",
    "endcard": "outro",
}

VO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vo")


def load_vo(take):
    """Decode audio/vo/<take>.mp3 to mono float32 at SR."""
    path = os.path.join(VO_DIR, f"{take}.mp3")
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, "<f4").astype(np.float64)


def compress(x, thresh_db=-24, ratio=3.0, attack=0.005, release=0.12):
    """Simple feed-forward compressor on a mono signal."""
    level = np.abs(x)
    a_att = np.exp(-1 / (attack * SR))
    a_rel = np.exp(-1 / (release * SR))
    # Peak follower: fast attack, slower release (two one-pole passes).
    env = signal.lfilter([1 - a_rel], [1, -a_rel], level)
    env = np.maximum(env, signal.lfilter([1 - a_att], [1, -a_att], level))
    env_db = 20 * np.log10(env + 1e-9)
    over = np.maximum(0, env_db - thresh_db)
    return x * 10 ** (-over * (1 - 1 / ratio) / 20)

#            pad   bright drone kick  bass  hats  arp   clock
LEVELS = {
    "intro":   (0.45, 0.45, 0.35, 0.90, 0.80, 0.75, 0.55, 0.00),
    "tension": (0.60, 0.25, 0.80, 0.00, 0.00, 0.35, 0.35, 0.45),
    "drop":    (1.00, 0.90, 0.30, 1.00, 1.00, 1.00, 1.00, 0.00),
    "drive":   (1.00, 0.85, 0.20, 1.00, 1.00, 1.00, 1.00, 0.00),
    "lift":    (0.95, 0.75, 0.20, 0.85, 0.85, 0.85, 1.00, 0.00),
    "outro":   (1.00, 1.00, 0.20, 0.00, 0.00, 0.00, 0.35, 0.00),
}


# ---------------------------------------------------------------- compose


def compose(meta):
    dur = meta["duration"]
    n = int(round(dur * SR))
    scenes = meta["scenes"]
    cues = meta["cues"]

    music = Bus(n)
    sfx = Bus(n)
    verb = Bus(n)  # reverb send

    impact_t = next((c["t"] for c in cues if c["type"] == "impact"), None)
    end_t = next((s["start"] for s in scenes if s["name"] == "endcard"), dur)

    # Per-sample automation curves from the section table. In the reveal,
    # the beat drops on the logo hit, not at the scene cut.
    def section_at(t):
        for s in scenes:
            if s["start"] <= t < s["start"] + s["dur"]:
                sec = SECTION.get(s["name"], "drive")
                if sec == "drop" and impact_t is not None and t < impact_t:
                    return "tension"
                return sec
        return "outro"

    tt = secs(n)
    tc = np.arange(0, dur + 0.01, 0.01)
    coarse = np.array([LEVELS[section_at(x)] for x in tc])
    curves = np.stack([np.interp(tt, tc, smooth(coarse[:, i], 0.12, 100)) for i in range(coarse.shape[1])], axis=1)
    lvl = lambda i, t: curves[min(n - 1, max(0, int(t * SR))), i]  # noqa: E731
    PAD, BRIGHT, DRONE, KICK, BASS, HATS, ARP, CLOCK = range(8)

    def chord_at(t):
        if t >= end_t:
            return RESOLVE
        return CHORDS[int(t // (BAR * 2)) % len(CHORDS)]

    # --- pad: chord segments with overlap, filtered dark and bright, then
    # blended by the brightness curve.
    pad = np.zeros((n, 2))
    seg_starts = sorted(set([i * BAR * 2 for i in range(int(dur // (BAR * 2)) + 1)] + [end_t]))
    seg_starts = [s for s in seg_starts if s < dur]
    for si, s0 in enumerate(seg_starts):
        s1 = seg_starts[si + 1] if si + 1 < len(seg_starts) else dur
        notes, _ = chord_at(s0 + 0.01)
        rel = 1.2
        m = int((s1 - s0 + rel) * SR)
        t = secs(m)
        env = np.clip(t / 0.35, 0, 1) * np.clip((s1 - s0 + rel - t) / rel, 0, 1)
        left = np.zeros(m)
        right = np.zeros(m)
        for k, note in enumerate(notes):
            f = midi(note)
            left += saw(f * 2 ** (-6 / 1200), m, 26, phase=k)
            right += saw(f * 2 ** (6 / 1200), m, 26, phase=k * 1.7)
        seg = np.stack([left, right], axis=1) * env[:, None] / len(notes)
        i0 = int(s0 * SR)
        j0 = min(n, i0 + m)
        pad[i0:j0] += seg[: j0 - i0]
    dark = lp(pad, 900, 2)
    bright = lp(pad, 5200, 2)
    b = curves[:, BRIGHT][:, None]
    pad = (dark * (1 - b) + bright * b) * curves[:, PAD][:, None]
    # gentle side-chain pump on the beat while the kick plays
    beat_phase = (tt % BEAT) / BEAT
    pump = 1 - 0.32 * curves[:, KICK] * np.exp(-beat_phase * BEAT / 0.11)
    pad *= pump[:, None]
    pad = hp(pad, 110, 2)
    music.buf += pad * db(-11)
    verb.buf += pad * db(-18)

    # --- drone: D (plus A) across three octaves, under the hook and tension
    t = tt
    drone = (0.5 * np.sin(2 * np.pi * midi(38) * t) + 0.55 * np.sin(2 * np.pi * midi(50) * t)
             + 0.6 * np.sin(2 * np.pi * midi(57) * t + 1.0) + 0.3 * np.sin(2 * np.pi * midi(69) * t + 2.0)
             + 0.35 * saw(midi(50), n, 12))
    drone = hp(lp(drone, 1600), 60) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.25 * t))
    music.buf += pan2(drone * curves[:, DRONE], 0) * db(-26)

    # --- rhythm on the beat grid
    nb = int(dur / (BEAT / 4)) + 1
    for i in range(nb):
        t0 = i * BEAT / 4  # 16th notes
        if t0 >= dur:
            break
        sixteenth = i % 4
        beat_i = i // 4
        notes, root = chord_at(t0)
        if sixteenth == 0:
            if lvl(KICK, t0) > 0.02:
                music.add(t0, kick(), db(-12) * lvl(KICK, t0))
                if beat_i % 2 == 1:
                    music.add(t0, clap(), db(-19) * lvl(KICK, t0))
            if lvl(CLOCK, t0) > 0.02:
                c = click(0.9, 4200 if beat_i % 2 else 3200)
                music.add(t0, c, db(-21) * lvl(CLOCK, t0), pan=0.2 if beat_i % 2 else -0.2)
        if sixteenth in (0, 2) and lvl(BASS, t0) > 0.02 and t0 < end_t:
            octave = 12 if (sixteenth == 2 and beat_i % 2 == 1) else 0
            music.add(t0, bass_note(midi(root + octave), BEAT / 2 * 0.9), db(-18) * lvl(BASS, t0))
        if lvl(HATS, t0) > 0.02:
            if sixteenth == 2:
                music.add(t0, hat(1.0), db(-16) * lvl(HATS, t0), pan=0.25)
            elif sixteenth in (1, 3):
                music.add(t0, hat(0.5, 0.03), db(-22) * lvl(HATS, t0), pan=-0.3)
            elif lvl(KICK, t0) > 0.5:
                music.add(t0, hat(0.35, 0.025), db(-25) * lvl(HATS, t0), pan=0.1)
            if lvl(KICK, t0) > 0.02:
                sh = bp(noise(int(0.07 * SR)), 3500, 9000) * exp_env(int(0.07 * SR), 0.018, 0.004)
                music.add(t0, sh, db(-27) * lvl(KICK, t0) * (1.0 if sixteenth % 2 else 0.6), pan=0.5 if i % 2 else -0.5)
        if lvl(ARP, t0) > 0.02:
            pattern = [0, 2, 1, 3, 2, 4, 1, 3]
            note = notes[pattern[i % len(pattern)] % len(notes)] + 12
            p = pluck(midi(note), 0.9 if sixteenth == 0 else 0.6)
            g = db(-21) * lvl(ARP, t0)
            music.add(t0, p, g, pan=0.45 if i % 2 else -0.45)
            verb.add(t0, p, g * 0.8)
            # dotted-eighth echo
            music.add(t0 + BEAT * 0.75, p, g * 0.35, pan=-0.45 if i % 2 else 0.45)

    # Final chord on the end card: a soft hit and a long bell.
    if end_t < dur:
        notes, root = RESOLVE
        for k, note in enumerate(notes[1:5]):
            bl = bell(midi(note + 12), 2.4, 0.5)
            sfx.add(end_t + k * 0.06, bl, db(-24), pan=(-0.4, 0.4, -0.15, 0.15)[k])
            verb.add(end_t + k * 0.06, bl, db(-22))
        sfx.add(end_t, sub_drop(0.6, 1.4), db(-12))

    # ---------------------------------------------------------- sound effects
    for s in scenes[1:]:
        w = whoosh(0.55, 0.78)
        sfx.add(s["start"] - 0.43, w, db(-21), pan=0.0)
        verb.add(s["start"] - 0.43, w, db(-28))

    # A roll and crash into the dashboard wall.
    for s in scenes:
        if s["name"] == "live" and s["start"] > 1.2:
            sfx.add(s["start"] - 1.0, roll(1.0), db(-19))
            sfx.add(s["start"], crash(0.9), db(-19))

    # Riser into the end card.
    if end_t < dur and end_t > 2:
        r = riser(1.3)
        sfx.add(end_t - 1.3, r, db(-24))

    # The pre-drop hush: music falls away under "Introducing", a riser leads
    # into it, and the beat drops on the logo.
    hush = np.ones(n)
    for c in cues:
        if c["type"] != "hush":
            continue
        a, b = c["t"] - 0.05, c["until"]
        length = min(1.4, max(0.5, a))
        sfx.add(a - length, riser(length), db(-21))
        sfx.add(a - length, roll(length), db(-17))
        i0, i1 = int(a * SR), int(b * SR)
        hush[i0:i1] = 0.07
    hush = smooth(hush, 0.04)

    last = {}
    for c in cues:
        t0, kind = c["t"], c["type"]
        if kind == "scene":
            continue
        # Keep busy passages from turning into noise.
        gap = {"blip": 0.16, "pass": 0.22, "approve": 0.2, "tick": 0.08, "paste": 0.1}.get(kind, 0)
        if gap and t0 - last.get(kind, -9) < gap:
            continue
        last[kind] = t0

        if kind == "whip":
            sfx.add(t0 - 0.16, whoosh(0.3, 0.55, 500, 7000), db(-22), pan=0.3)
        elif kind == "slam":
            sfx.add(t0 - 0.12, whoosh(0.22, 0.6, 600, 6000), db(-24))
            sfx.add(t0, kick(0.7), db(-16))
        elif kind == "paste":
            sfx.add(t0, click(1.0, 1600), db(-23))
        elif kind == "alert":
            for k, f in enumerate((660, 520)):
                sfx.add(t0 + k * 0.11, buzz(f, 0.09), db(-26))
        elif kind == "flag":
            sfx.add(t0, buzz(196, 0.12), db(-27))
        elif kind == "impact":
            sfx.add(t0, sub_drop(1.0, 1.8), db(-7))
            sfx.add(t0, crash(), db(-17))
            verb.add(t0, crash(0.6), db(-20))
            nz = lp(noise(int(0.9 * SR)), 2500) * exp_env(int(0.9 * SR), 0.18, 0.001)
            sfx.add(t0, nz, db(-21))
            verb.add(t0, nz, db(-16))
            for k, note in enumerate((74, 81, 86)):
                bl = bell(midi(note), 1.6, 0.5)
                sfx.add(t0 + 0.02 * k, bl, db(-27), pan=(-0.3, 0.3, 0)[k])
                verb.add(t0 + 0.02 * k, bl, db(-24))
        elif kind == "shimmer":
            for k, note in enumerate((81, 86, 88, 93)):
                bl = bell(midi(note), 0.9, 0.5)
                sfx.add(t0 + k * 0.055, bl, db(-31), pan=(-0.5, -0.15, 0.15, 0.5)[k])
                verb.add(t0 + k * 0.055, bl, db(-28))
        elif kind == "tick":
            sfx.add(t0, click(1.0, 2400), db(-24))
        elif kind == "phrase":
            sfx.add(t0 - 0.18, whoosh(0.4, 0.6, 400, 3500), db(-27))
        elif kind == "blip":
            f = rng.choice([1568, 1760, 2093])
            m = int(0.07 * SR)
            x = np.sin(2 * np.pi * f * secs(m)) * exp_env(m, 0.018, 0.001)
            sfx.add(t0, x, db(-31), pan=rng.uniform(-0.4, 0.4))
        elif kind == "pass":
            sfx.add(t0, click(0.8, 1800), db(-29))
        elif kind == "block":
            sfx.add(t0, buzz(98, 0.26), db(-22))
            sfx.add(t0 + 0.13, buzz(92, 0.18), db(-26))
        elif kind == "approve":
            for k, note in enumerate((88, 93)):
                bl = bell(midi(note), 0.55, 0.6)
                sfx.add(t0 + k * 0.06, bl, db(-30), pan=0.2)
                verb.add(t0 + k * 0.06, bl, db(-30))
        elif kind == "chime":
            for k, note in enumerate((81, 85, 88)):
                bl = bell(midi(note), 1.0, 0.6)
                sfx.add(t0 + k * 0.07, bl, db(-28), pan=(-0.3, 0, 0.3)[k])
                verb.add(t0 + k * 0.07, bl, db(-27))
        elif kind == "cta":
            sfx.add(t0, click(1.0, 2200), db(-22))
            bl = bell(midi(84), 0.8, 0.6)
            sfx.add(t0 + 0.02, bl, db(-29))
            verb.add(t0 + 0.02, bl, db(-28))

    # ---------------------------------------------------------- mix
    ir = reverb_ir()
    wet = np.stack([signal.fftconvolve(verb.buf[:, 0], ir[:, 0])[:n], signal.fftconvolve(verb.buf[:, 1], ir[:, 1])[:n]], axis=1)
    # Music bus tone: less boxiness around 400 Hz, more air on top.
    mbus = biquad(music.buf, "peak", 420, -4.0, 0.8)
    mbus = biquad(mbus, "highshelf", 3200, 4.0)
    mbus *= hush[:, None]
    bed = mbus + sfx.buf + wet * db(-4)
    bed = hp(bed, 28, 2)

    # Soft-knee limiting on the bed, then set it to -24 dBFS RMS.
    peak = np.max(np.abs(bed)) or 1.0
    bed = np.tanh(bed / peak * 1.25) / np.tanh(1.25)
    bed *= db(-24) / (np.sqrt(np.mean(bed ** 2)) or 1.0)

    # Voiceover: placed line by line, cleaned up, and the bed ducks under it.
    vo_track = np.zeros(n)
    duck = np.zeros(n)
    if meta.get("vo") and meta.get("take"):
        src = load_vo(meta["take"])
        for v in meta["vo"]:
            a, b = int(v["src"][0] * SR), int(v["src"][1] * SR)
            seg = src[a:b].copy()
            f = min(len(seg) // 4, int(0.012 * SR))
            if f:
                seg[:f] *= np.linspace(0, 1, f)
                seg[-f:] *= np.linspace(1, 0, f)
            i0 = int(v["at"] * SR)
            i1 = min(n, i0 + len(seg))
            vo_track[i0:i1] += seg[: i1 - i0]
            duck[max(0, i0 - int(0.08 * SR)):min(n, i1 + int(0.15 * SR))] = 1
        vo_track = hp(vo_track, 90, 2)
        vo_track = biquad(vo_track, "peak", 3500, 2.5, 0.9)
        vo_track = compress(vo_track, thresh_db=-26, ratio=3.0)
        voiced = np.abs(vo_track) > 1e-4
        rms = np.sqrt(np.mean(vo_track[voiced] ** 2)) if voiced.any() else 1.0
        vo_track *= db(-17) / rms
        duck = smooth(duck, 0.12)
    gain = 1 - (1 - db(-7)) * duck
    mix = bed * gain[:, None] + pan2(vo_track, 0) * np.sqrt(2)

    # Fade the very end so the last frame doesn't cut off a sound.
    fade = int(min(1.0, dur * 0.08) * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    mix[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))[:, None]
    mix *= db(-1) / (np.max(np.abs(mix)) or 1.0)
    return mix


def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cues", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    with open(a.cues) as f:
        meta = json.load(f)
    mix = compose(meta)
    write_wav(a.out, mix)
    print(f"  score: {meta['cut']} {meta['duration']:.1f}s -> {a.out}")


if __name__ == "__main__":
    main()
