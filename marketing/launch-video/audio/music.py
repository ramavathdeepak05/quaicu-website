#!/usr/bin/env python3
"""Music bed for the Month Twelve campaign videos.

Profile matched to the Zelios reference film's soundtrack (analysed, not
copied): about 144 BPM, C# major, a two-chord I-vi loop with an occasional
IV and V, a quiet intro that builds into a drop, a steady melodic bed with
light half-time drums and a pumping sub, a thinner outro, and a deep boom
under the logo. Everything is synthesised here with numpy and scipy (no
samples), deterministic, and arranged from the video's cue file:

  * the drop lands on the second scene's cut (a riser leads into it)
  * drums stop on the end card; a boom, a held chord and a bell flourish
    resolve it, and the reverb tail fades out by the end
  * narration ("vo" cues with t and dur): the bell motif stays out of the
    way and the bed dips a little; ffmpeg ducks it further when mixing
  * quiet UI sounds for cue types (tick, pass, approve, stamp, typing,
    swell, chime, block, phrase, cta, alert), tuned to the key

  python3 audio/music.py --cues <cues.json> --out <score.wav>

Same interface as compose.py (the launch video's score, which stays as is).
Output: 48 kHz stereo 16-bit WAV, exactly the cue file's duration.
"""

import argparse
import hashlib
import json

import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000
BPM = 144.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

# C# major. Chords as (bass root MIDI, pad voicing MIDI) with common-tone
# voice leading around C#4-A#4, roots in the second octave.
CHORDS = {
    "I": (37, [61, 65, 68]),   # C#  : C# F G#
    "vi": (34, [61, 65, 70]),  # A#m : C# F A#
    "IV": (42, [61, 66, 70]),  # F#  : C# F# A#
    "V": (44, [60, 63, 68]),   # G#  : B#(C) D# G#
}
LOOP = ["I", "vi", "I", "vi", "IV", "vi", "I", "V"]
SCALE = {1, 3, 5, 6, 8, 10, 0}  # C# major pitch classes: C# D# F F# G# A# B#(C)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def secs(n):
    return np.arange(n) / SR


def db(x):
    return 10 ** (x / 20)


# ---------------------------------------------------------------- buses

class Bus:
    def __init__(self, n):
        self.n = n
        self.x = np.zeros((n, 2))

    def add(self, t0, sig, gain=1.0, pan=0.0):
        a = int(round(t0 * SR))
        if sig.ndim == 1:
            th = (pan + 1) * np.pi / 4
            sig = np.stack([sig * np.cos(th), sig * np.sin(th)], axis=1) * np.sqrt(2)
        if a < 0:
            sig = sig[-a:]
            a = 0
        b = min(self.n, a + len(sig))
        if b > a:
            self.x[a:b] += sig[: b - a] * gain


# ---------------------------------------------------------------- oscillators and filters

def saw(freq, n, phase=0.0):
    """Band-limited sawtooth (polyBLEP)."""
    dt = freq / SR
    ph = (phase + dt * np.arange(n)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    x = ph[m] / dt
    y[m] -= x + x - x * x - 1.0
    m = ph > 1.0 - dt
    x = (ph[m] - 1.0) / dt
    y[m] -= x * x + x + x + 1.0
    return y


def sine(freq, n, phase=0.0):
    return np.sin(2 * np.pi * freq * secs(n) + phase)


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)


def fade(x, a=0.003, r=0.02):
    """Short fades at both ends so nothing clicks."""
    n = len(x)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    env = np.ones(n)
    if na:
        env[:na] = np.linspace(0, 1, na)
    if nr:
        env[n - nr:] *= np.linspace(1, 0, nr)
    return x * (env if x.ndim == 1 else env[:, None])


# ---------------------------------------------------------------- instruments

def pluck(f, length=0.34, bright=1.0, rng=None):
    n = int((length + 0.08) * SR)
    t = secs(n)
    osc = 0.55 * saw(f * 1.004, n) + 0.55 * saw(f * 0.996, n, 0.37) + 0.2 * sine(f * 2, n)
    k = np.exp(-t / (0.05 + 0.03 * bright))           # filter envelope
    y = lp(osc, 750) * (1 - k) + lp(osc, 3200 + 3500 * bright) * k
    amp = np.exp(-t / 0.16) * np.minimum(1, t / 0.003)
    return fade(y * amp, 0.002, 0.04)


def pad(notes, length, rng, cutoff=2000.0):
    n = int((length + 0.6) * SR)
    t = secs(n)
    L = np.zeros(n)
    R = np.zeros(n)
    for note in notes:
        f = midi(note)
        for k, cents in enumerate((-14, -7, 0, 7, 14)):
            ph = rng.random()
            v = saw(f * 2 ** (cents / 1200), n, ph)
            if k % 2:
                L += v * (0.9 if k < 3 else 0.6)
            else:
                R += v * (0.9 if k < 3 else 0.6)
            if k == 2:
                L += 0.5 * v
                R += 0.5 * v
    env = np.minimum(1, t / 0.35) * np.where(t > length, np.exp(-(t - length) / 0.25), 1.0)
    st = np.stack([L, R], axis=1) * env[:, None]
    return lp(st, cutoff) * 0.12


def bell(f, length=1.2):
    n = int(length * SR)
    t = secs(n)
    idx = 2.2 * np.exp(-t / 0.12)
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t))
    y += 0.25 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.25)
    return fade(y * np.exp(-t / 0.45) * np.minimum(1, t / 0.002), 0.001, 0.05)


def kick():
    n = int(0.45 * SR)
    t = secs(n)
    f = 46 + 120 * np.exp(-t / 0.032)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.26)
    click = hp(np.random.default_rng(7).standard_normal(n), 2500) * np.exp(-t / 0.004) * 0.25
    return fade(np.tanh(1.6 * y) * 0.9 + click, 0.0005, 0.03)


def clap(rng):
    n = int(0.5 * SR)
    t = secs(n)
    noise = bp(rng.standard_normal(n), 900, 2600)
    env = np.zeros(n)
    for off in (0.0, 0.011, 0.022):
        m = t >= off
        env[m] += np.exp(-(t[m] - off) / 0.007)
    env += 0.35 * np.exp(-t / 0.11) * (t > 0.022)
    return fade(noise * env * 0.6, 0.0005, 0.05)


def hat(rng, open_=False):
    n = int((0.35 if open_ else 0.08) * SR)
    t = secs(n)
    y = hp(rng.standard_normal(n), 7500, 4) * np.exp(-t / (0.16 if open_ else 0.022))
    return fade(y, 0.0005, 0.01)


def shaker(rng):
    n = int(0.07 * SR)
    t = secs(n)
    env = np.minimum(1, t / 0.01) * np.exp(-t / 0.025)
    return fade(bp(rng.standard_normal(n), 4500, 11000) * env, 0.001, 0.01)


def bass_note(root, length):
    n = int((length + 0.05) * SR)
    t = secs(n)
    f = midi(root)
    sub = np.sin(2 * np.pi * f * t)
    # Upper harmonics so the bass still reads on phone speakers.
    body = lp(saw(f, n) + 0.5 * saw(f * 2.002, n), 520)
    env = np.minimum(1, t / 0.006) * np.where(t > length, np.exp(-(t - length) / 0.03), 1.0)
    return fade((np.tanh(1.4 * sub) * 0.75 + 0.32 * body) * env, 0.002, 0.03)


def noise_sweep(rng, length, lo=300, hi=9000, rise=True):
    n = int(length * SR)
    t = secs(n)
    x = rng.standard_normal(n)
    segs = 16
    out = np.zeros(n)
    edges = np.linspace(0, n, segs + 1).astype(int)
    for i in range(segs):
        k = (i + 0.5) / segs
        fc = lo * (hi / lo) ** (k if rise else 1 - k)
        seg = bp(x, fc * 0.7, min(fc * 1.4, SR * 0.45))[edges[i]:edges[i + 1]]
        out[edges[i]:edges[i + 1]] = seg
    return out


def riser(rng, length):
    n = int(length * SR)
    t = secs(n)
    x = noise_sweep(rng, length, 400, 9000, True) * (t / length) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(300 * 2 ** (2.2 * t / length)) / SR) * 0.15 * (t / length) ** 3
    return fade(x * 0.5 + tone, 0.05, 0.02)


def whoosh(rng, length=0.5):
    n = int(length * SR)
    t = secs(n)
    env = np.sin(np.pi * t / length) ** 2
    return fade(noise_sweep(rng, length, 600, 6000, True) * env * 0.5, 0.01, 0.02)


def boom():
    n = int(2.4 * SR)
    t = secs(n)
    f = 30 + 38 * np.exp(-t / 0.25)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.75)
    thump = lp(np.random.default_rng(11).standard_normal(n), 220) * np.exp(-t / 0.09) * 0.6
    return fade(np.tanh(1.8 * y) + thump, 0.001, 0.2)


def blip(f, length=0.09, decay=0.03):
    n = int(length * SR)
    t = secs(n)
    return fade(np.sin(2 * np.pi * f * t) * np.exp(-t / decay), 0.001, 0.01)


def click(rng, f=2600, decay=0.004):
    n = int(0.03 * SR)
    t = secs(n)
    return fade(bp(rng.standard_normal(n), f * 0.7, f * 1.4) * np.exp(-t / decay), 0.0003, 0.005)


# ---------------------------------------------------------------- effects

def reverb_ir(rng, length=1.9, decay=0.55, lowcut=180, highcut=7000):
    n = int(length * SR)
    t = secs(n)
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], axis=1) * np.exp(-t / decay)[:, None]
    ir = lp(hp(ir, lowcut), highcut)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]  # small pre-delay feel
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir):
    out = np.zeros((len(x), 2))
    for c in range(2):
        out[:, c] = signal.fftconvolve(x[:, c], ir[:, c])[: len(x)]
    return out


def delay(x, time, fb=0.32, taps=4, pingpong=True):
    d = int(time * SR)
    out = np.zeros_like(x)
    g = fb
    for k in range(1, taps + 1):
        sh = np.zeros_like(x)
        if d * k < len(x):
            sh[d * k:] = x[: len(x) - d * k]
        if pingpong and k % 2:
            sh = sh[:, ::-1]
        out += sh * g
        g *= fb
    return out


def smooth(env, ms):
    a = np.exp(-1.0 / (SR * ms / 1000))
    return signal.lfilter([1 - a], [1, -a], env)


def compressor(x, thr_db=-16, ratio=2.5, attack=0.01, release=0.15):
    lvl = np.max(np.abs(x), axis=1)
    up = smooth(lvl, attack * 1000)
    env = np.maximum(up, smooth(lvl, release * 1000))
    thr = db(thr_db)
    gain = np.where(env > thr, (thr / np.maximum(env, 1e-9)) ** (1 - 1 / ratio), 1.0)
    return x * smooth(gain, 5)[:, None]


# ---------------------------------------------------------------- composition

def compose(meta):
    dur = float(meta["duration"])
    n = int(round(dur * SR))
    scenes = meta["scenes"]
    cues = meta["cues"]
    seed = int(hashlib.sha1(json.dumps([round(dur, 3), [s["name"] for s in scenes]]).encode()).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)

    end = next((s for s in scenes if s["name"] == "endcard"), None)
    end_t = end["start"] if end else dur
    drop_t = scenes[1]["start"] if len(scenes) > 1 and scenes[1]["start"] < end_t else min(BAR, end_t)
    if drop_t < 1.0:  # too soon for an intro: drop at the first bar line instead
        drop_t = BAR if BAR < end_t else drop_t

    # Narration spans (seconds), for keeping the bell motif out of the way.
    vo = [(c["t"], c["t"] + c.get("dur", 0.36 * len(c.get("text", "").split()))) for c in cues if c["type"] == "vo"]
    def in_vo(t, pad=0.15):
        return any(a - pad <= t <= b + pad for a, b in vo)

    music, drums, bass, fx, sfx = (Bus(n) for _ in range(5))
    send = Bus(n)    # reverb send
    dsend = Bus(n)   # delay send (plucks)

    def chord_at(t):
        return CHORDS[LOOP[int(t // BAR) % len(LOOP)]]

    # --- pad: one chord per bar; darker in the intro, opens up after the drop
    nbars = int(np.ceil(dur / BAR)) + 1
    for b in range(nbars):
        t0 = b * BAR
        if t0 >= dur:
            break
        root, notes = chord_at(t0 + 0.01)
        if t0 >= end_t:
            root, notes = CHORDS["I"]
        cutoff = 1500 if t0 < drop_t else 3600
        length = BAR if t0 + BAR < end_t or t0 >= end_t else end_t - t0
        if t0 >= end_t:
            length = dur - t0
        p = pad(notes, length, rng, cutoff)
        music.add(t0, p, db(-5))
        send.add(t0, p, db(-6))
    if end is not None and end_t % BAR > 0.05:
        # Resolve on the end card even when it starts mid-bar.
        p = pad(CHORDS["I"][1] + [73], dur - end_t, rng, 2400)
        music.add(end_t, p, db(0))
        send.add(end_t, p, db(-4))

    # --- plucked arpeggio, 16ths, two octaves of chord tones
    pattern = [0, 2, 1, 2, 4, 2, 1, 3, 0, 2, 1, 2, 5, 3, 2, 1]
    step = BEAT / 4
    k = 0
    t = 0.0
    while t < dur - 0.05:
        root, notes = chord_at(t + 0.001)
        tones = sorted(notes) + [x + 12 for x in sorted(notes)]
        i = pattern[k % 16]
        # 8th notes, with 16th pickups only on the last beat of the bar.
        if k % 2 and (k % 16) < 12:
            k += 1
            t += step
            continue
        if t >= end_t:
            # End card: slower, falling away.
            if k % 2:
                k += 1
                t += step
                continue
            vel = 0.8 * np.exp(-(t - end_t) / 1.4)
            bright = 0.3
        elif t < drop_t:
            vel = 0.55 + 0.35 * (t / max(drop_t, 0.01))
            bright = 0.15 + 0.6 * (t / max(drop_t, 0.01))
        else:
            vel = 0.85 if k % 4 == 0 else 0.62
            bright = 0.85
        vel *= 0.85 if in_vo(t, 0) else 1.0
        note = tones[i % len(tones)]
        s = pluck(midi(note), 0.3, bright) * vel * (1 + 0.08 * (rng.random() - 0.5))
        pan = 0.35 * np.sin(k * 0.9)
        music.add(t, s, db(-9), pan)
        dsend.add(t, s, db(-14), pan)
        send.add(t, s, db(-16), pan)
        k += 1
        t += step

    # --- bell motif: two bars, only where the narration leaves room
    motif = [(0.0, 80), (0.75, 77), (1.5, 73), (2.5, 75), (3.0, 77), (4.0, 80), (5.0, 82), (6.0, 77)]
    cycle = 2 * BAR
    c0 = 0.0
    while c0 < end_t:
        for beat, note in motif:
            tt = c0 + beat * BEAT
            if tt >= end_t or tt >= dur:
                continue
            if in_vo(tt):
                continue
            b = bell(midi(note), 1.1)
            music.add(tt, b, db(-15), 0.2)
            send.add(tt, b, db(-10), 0.2)
        c0 += cycle
    if end is not None:
        for j, note in enumerate((73, 80, 85, 92)):
            tt = end_t + 1.0 + j * BEAT / 2
            if tt < dur - 0.3:
                b = bell(midi(note), 1.8)
                music.add(tt, b, db(-13), -0.2 + 0.15 * j)
                send.add(tt, b, db(-7))

    # --- drums (after the drop, until the end card): half-time groove
    kicks = []
    k16 = BEAT / 4
    g = int(np.ceil(drop_t / k16 - 1e-6))
    while g * k16 < end_t - 0.02:
        tt = g * k16
        pos = g % 16  # 16th within the bar (bar grid from t = 0)
        sw = 0.012 if g % 2 else 0.0  # light swing on off-16ths
        if pos in (0, 10):
            kicks.append(tt)
            drums.add(tt, kick(), db(3))
        if pos == 8:
            c = clap(rng)
            drums.add(tt, c, db(-1.5))
            send.add(tt, c, db(-12))
        if pos % 2 == 0:
            drums.add(tt + sw, hat(rng), db(-16 if pos % 4 == 0 else -12), 0.25)
        elif pos % 4 == 3:
            drums.add(tt + sw, shaker(rng), db(-19), -0.3)
        if pos == 14 and (g // 16) % 2 == 1:
            drums.add(tt, hat(rng, True), db(-17), 0.3)
        g += 1
    # Fill into the end card: a short clap roll.
    if end is not None and end_t - drop_t > 2 * BEAT:
        for j in range(4):
            tt = end_t - (4 - j) * BEAT / 4
            if tt > drop_t:
                drums.add(tt, clap(rng), db(-15 + 2 * j))

    # --- bass: root on a syncopated pattern, pumped by the kick
    bass_pat = [(0.0, 1.0), (1.5, 0.5), (2.5, 0.5), (3.0, 0.75)]
    b = int(np.floor(drop_t / BAR))
    while b * BAR < end_t:
        for beat, length in bass_pat:
            tt = b * BAR + beat * BEAT
            if tt < drop_t - 1e-6 or tt >= end_t:
                continue
            root, _ = chord_at(tt + 0.001)
            L = min(length * BEAT, end_t - tt)
            bass.add(tt, bass_note(root, L * 0.92), db(-1.5))
        b += 1
    if end is not None:
        bass.add(end_t, bass_note(CHORDS["I"][0], min(2.0, dur - end_t - 0.1)), db(-5))

    # Sidechain pump from the kicks onto pad, plucks and bass.
    tt = secs(n)
    pump = np.ones(n)
    for kt in kicks:
        a = int(kt * SR)
        m = min(n, a + int(0.3 * SR))
        x = tt[a:m] - kt
        pump[a:m] = np.minimum(pump[a:m], 1 - 0.55 * np.exp(-x / 0.09))
    music.x *= pump[:, None]
    bass.x *= (0.35 + 0.65 * pump)[:, None]

    # --- transitions: riser into the drop and into the end card, whooshes on cuts
    rl = min(1.6, drop_t - 0.1)
    if rl > 0.4:
        fx.add(drop_t - rl, riser(rng, rl), db(-15))
    if end is not None and end_t - drop_t > 2.0:
        fx.add(end_t - 1.3, riser(rng, 1.3), db(-17))
    for s in scenes[1:]:
        fx.add(s["start"] - 0.28, whoosh(rng, 0.55), db(-24), rng.uniform(-0.4, 0.4))
    fx.add(drop_t, hat(rng, True) * 1.2, db(-16))
    if end is not None:
        fx.add(end_t, noise_sweep(rng, 1.2, 9000, 600, False) * np.exp(-secs(int(1.2 * SR)) / 0.4) * 0.4, db(-18))

    # --- UI sounds and cue hits
    last = {}
    for c in cues:
        t0, kind = c["t"], c["type"]
        if kind in ("scene", "vo"):
            continue
        gap = {"tick": 0.08, "pass": 0.1, "approve": 0.15, "stamp": 0.1, "phrase": 0.3, "swell": 0.4}.get(kind, 0.05)
        if t0 - last.get(kind, -9) < gap:
            continue
        last[kind] = t0
        if kind == "tick":
            sfx.add(t0, blip(midi(97), 0.06, 0.012), db(-30), rng.uniform(-0.3, 0.3))
        elif kind == "pass":
            sfx.add(t0, click(rng, 2200) * 0.6 + blip(midi(85), 0.08, 0.02) * 0.5, db(-27))
        elif kind == "approve":
            sfx.add(t0, bell(midi(85), 0.5), db(-27), 0.2)
            sfx.add(t0 + 0.07, bell(midi(92), 0.6), db(-29), 0.2)
        elif kind == "stamp":
            sfx.add(t0, lp(click(rng, 900, 0.01), 1500) * 2 + blip(80, 0.12, 0.04), db(-22))
        elif kind == "typing":
            m = int(c.get("n", 20))
            cps = float(c.get("cps", 18))
            for j in range(0, m, 2):
                sfx.add(t0 + j / cps + rng.uniform(-0.01, 0.01), click(rng, rng.uniform(2800, 4200)), db(-31), rng.uniform(-0.2, 0.2))
        elif kind in ("swell", "phrase"):
            sfx.add(t0 - 0.15, whoosh(rng, 0.45 if kind == "swell" else 0.35), db(-27 if kind == "swell" else -31))
        elif kind == "chime":
            for j, note in enumerate((85, 89, 92)):
                b = bell(midi(note), 0.9)
                sfx.add(t0 + j * 0.06, b, db(-29), -0.3 + 0.3 * j)
        elif kind == "block":
            sfx.add(t0, lp(saw(midi(49), int(0.18 * SR)), 600) * np.exp(-secs(int(0.18 * SR)) / 0.06), db(-27))
        elif kind == "cta":
            sfx.add(t0, bell(midi(85), 0.9), db(-26))
            sfx.add(t0, click(rng, 2400), db(-28))
        elif kind == "alert":
            for j, note in enumerate((88, 84)):
                sfx.add(t0 + j * 0.12, blip(midi(note), 0.1, 0.05), db(-26))
        elif kind == "impact":
            fx.add(t0, boom(), db(-3))
            send.add(t0, boom(), db(-14))

    # --- the narration dips the whole bed a little (ffmpeg ducks it more)
    duck = np.ones(n)
    for a, b2 in vo:
        duck[int(a * SR): int(min(dur, b2) * SR)] = db(-2.5)
    duck = smooth(smooth(duck, 60), 60)
    music.x *= duck[:, None]
    drums.x *= duck[:, None]

    # --- effects returns and master
    dly = delay(dsend.x, BEAT * 0.75, 0.38, 5)
    send.add(0, dly, db(-8))
    music.x += dly * db(-5)
    rev = convolve(send.x, reverb_ir(rng))
    mix = hp(music.x, 140) + hp(drums.x, 30) + lp(hp(bass.x, 28), 900) + hp(fx.x, 35) + hp(sfx.x, 200) + hp(rev, 150) * db(-4)
    mix = compressor(mix, -14, 2.2)
    mix = np.tanh(mix * 1.15) / 1.15
    mix = fade(mix, 0.02, 0.6 if end is not None else 0.25)
    peak = float(np.max(np.abs(mix))) or 1.0
    mix = mix / peak * db(-1.2)
    assert np.isfinite(mix).all()
    return mix


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cues", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    meta = json.load(open(a.cues))
    mix = compose(meta)
    sf.write(a.out, mix.astype(np.float32), SR, subtype="PCM_16")
    print(f"  music: {meta['duration']:.1f}s -> {a.out}")


if __name__ == "__main__":
    main()
