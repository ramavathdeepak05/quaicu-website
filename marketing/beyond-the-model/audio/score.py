"""Original score and sound design for "QUAICU: Beyond the Model", in code.

Everything here is synthesised (no samples, no licensed material), so the
soundtrack is free to use in paid placements. It reads the sound cues from
src/timeline.js, the processed voiceover from audio/vo.py, and writes:

  <out>/music.wav   score only
  <out>/sfx.wav     sound design only
  <out>/vo.wav      voiceover after EQ, compression and a short room
  <out>/mix.wav     everything, VO ducking the music (48 kHz stereo, 30.0 s)

Loudness normalisation (-14 LUFS, -1.5 dBTP) happens at mux time with ffmpeg.

usage: python3 audio/score.py --vo .work/audio/vo_raw.wav --out .work/audio
Harmony: D minor, 120 BPM (one beat = 0.5 s, so every 3 s cut lands on the
grid). Tension cluster at the gaps, Dm-Bb-F-C as the safeguards assemble,
Bb-F-Gm-A into the reveal, resolving to D major (add9) on the logo.
"""

import argparse
import os
import re

import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, lfilter, butter, sosfilt

SR = 48000
DUR = 30.0
MUSIC, SFX, VOICE = 0.22, 0.5, 1.6  # bus gains
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
TIMELINE = os.path.join(HERE, "..", "src", "timeline.js")
rng = np.random.default_rng(2026)


def note(name):
    names = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
    m = re.match(r"([A-G][b#]?)(-?\d)", name)
    return 440.0 * 2 ** ((names[m.group(1)] + 12 * (int(m.group(2)) + 1) - 69) / 12)


def stereo():
    return np.zeros((N + SR * 3, 2))


def place(bus, sig, t0, gain=1.0, pan=0.0):
    """Add mono or stereo sig at time t0 (s) with equal-power pan (-1..1)."""
    i0 = int(round(t0 * SR))
    if i0 >= len(bus):
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1)
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    n = min(len(sig), len(bus) - i0)
    bus[i0 : i0 + n] += sig[:n] * gain


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def fade(x, a=0.005, r=0.02):
    n = len(x)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    e = np.ones(n)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return x * (e if x.ndim == 1 else e[:, None])


# ---------------------------------------------------------------- filters
def biquad(kind, f, q=0.707, gain_db=0.0):
    w = 2 * np.pi * f / SR
    cw, sw = np.cos(w), np.sin(w)
    al = sw / (2 * q)
    A = 10 ** (gain_db / 40)
    if kind == "lp":
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]
        a = [1 + al, -2 * cw, 1 - al]
    elif kind == "hp":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
        a = [1 + al, -2 * cw, 1 - al]
    elif kind == "bp":
        b = [al, 0, -al]
        a = [1 + al, -2 * cw, 1 - al]
    elif kind == "peak":
        b = [1 + al * A, -2 * cw, 1 - al * A]
        a = [1 + al / A, -2 * cw, 1 - al / A]
    elif kind == "lowshelf":
        sa = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * cw + sa), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sa)]
        a = [(A + 1) + (A - 1) * cw + sa, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sa]
    elif kind == "highshelf":
        sa = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * cw + sa), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sa)]
        a = [(A + 1) - (A - 1) * cw + sa, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sa]
    b, a = np.array(b) / a[0], np.array(a) / a[0]
    return b, a


def filt(x, kind, f, q=0.707, g=0.0):
    b, a = biquad(kind, f, q, g)
    return lfilter(b, a, x, axis=0)


def tv_filter(x, kind, fc, q=0.707, block=256):
    """Time-varying biquad; fc is an array (Hz) the same length as x."""
    y = np.zeros_like(x)
    zi = np.zeros(2)
    for s in range(0, len(x), block):
        f = float(np.clip(fc[min(s + block // 2, len(fc) - 1)], 20, SR * 0.45))
        b, a = biquad(kind, f, q)
        y[s : s + block], zi = lfilter(b, a, x[s : s + block], zi=zi)
    return y


def reverb_ir(rt60=2.4, pre=0.018, damp=4500, width=1.0, seed=7):
    r = np.random.default_rng(seed)
    n = int(rt60 * 1.2 * SR)
    t = np.arange(n) / SR
    env = np.exp(-6.9 * t / rt60)
    ir = r.standard_normal((n, 2)) * env[:, None]
    # high frequencies die faster: blend toward a lowpassed copy over time
    lp = sosfilt(butter(2, damp, fs=SR, output="sos"), ir, axis=0)
    k = np.clip(t / (rt60 * 0.5), 0, 1)[:, None]
    ir = ir * (1 - k) + lp * k
    ir[:, 1] = ir[:, 1] * width + ir[:, 0] * (1 - width)
    ir = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    return ir / np.sqrt(np.sum(ir**2) / 2)


def reverb(bus, ir, wet):
    out = np.stack([fftconvolve(bus[:, 0], ir[:, 0])[: len(bus)], fftconvolve(bus[:, 1], ir[:, 1])[: len(bus)]], axis=1)
    return bus + out * wet


# ------------------------------------------------------------ instruments
def saw_voice(f, dur, fc, detune_c=0.0, hmax=7000.0, phase=0.0):
    """Band-limited saw by additive synthesis, with a time-varying 4-pole-ish
    lowpass applied per harmonic. fc: array (Hz) or float."""
    t = tt(dur)
    f = f * 2 ** (detune_c / 1200)
    H = max(1, int(hmax / f))
    fcv = np.broadcast_to(np.asarray(fc, dtype=float), t.shape)
    y = np.zeros_like(t)
    for n in range(1, H + 1):
        g = 1.0 / n / np.sqrt(1 + (n * f / fcv) ** 4)
        if np.max(g) < 1e-4:
            break
        y += g * np.sin(2 * np.pi * n * f * t + phase * n)
    return y


def pad(freqs, t0, dur, fc, gain, att=0.6, rel=0.9, spread=0.85, detune=7.0, bus=None):
    """Lush pad: three detuned saw voices per note, spread across the field."""
    t = tt(dur)
    env = np.clip(t / att, 0, 1) ** 1.5 * np.clip((dur - t) / rel, 0, 1) ** 1.2
    fcv = fc(t) if callable(fc) else fc
    for i, f in enumerate(freqs):
        for j, (dc, pn) in enumerate([(-detune, -spread), (0.0, 0.0), (detune, spread)]):
            v = saw_voice(f, dur, fcv, dc, phase=rng.uniform(0, 6.28)) * env
            place(bus, v, t0, gain / len(freqs) * (0.8 if j != 1 else 1.0), pn * (0.6 + 0.4 * ((i % 2) * 2 - 1) * 0.5))


def sine_pad(freqs, t0, dur, gain, att=1.2, rel=1.5, trem=0.0, bus=None, pan=0.0):
    t = tt(dur)
    env = np.clip(t / att, 0, 1) ** 2 * np.clip((dur - t) / rel, 0, 1) ** 1.5
    for i, f in enumerate(freqs):
        v = np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * env * (1 + trem * np.sin(2 * np.pi * (0.23 + 0.07 * i) * t))
        place(bus, v, t0, gain / len(freqs), pan + (i - (len(freqs) - 1) / 2) * 0.35)


def sub(f, t0, dur, gain, att=0.5, rel=0.8, bus=None):
    t = tt(dur)
    env = np.clip(t / att, 0, 1) ** 2 * np.clip((dur - t) / rel, 0, 1)
    v = np.tanh(1.6 * (np.sin(2 * np.pi * f * t) + 0.12 * np.sin(4 * np.pi * f * t))) * env
    place(bus, v, t0, gain)


def pluck(f, t0, gain, pan=0.0, dur=0.9, bright=0.5, bus=None):
    """Karplus-Strong pluck, a little glassy."""
    n = int(dur * SR)
    D = max(2, int(round(SR / f)))
    exc = filt(rng.standard_normal(D), "lp", 1500 + 6000 * bright)
    x = np.zeros(n)
    x[:D] = exc
    g = 0.996
    a = np.zeros(D + 2)
    a[0] = 1
    a[D] = -0.5 * g
    a[D + 1] = -0.5 * g
    y = lfilter([1.0], a, x)
    y = filt(y, "hp", 120)
    y *= np.exp(-np.arange(n) / SR / (dur * 0.35))
    place(bus, fade(y / (np.max(np.abs(y)) + 1e-9)), t0, gain, pan)


def bell(f, t0, gain, dur=2.5, pan=0.0, bus=None):
    t = tt(dur)
    parts = [(1.0, 1.0, 1.0), (2.0, 0.35, 0.7), (2.76, 0.25, 0.45), (5.4, 0.12, 0.25), (8.93, 0.05, 0.15)]
    y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (dur * d)) for r, a, d in parts)
    place(bus, fade(y * np.clip(t / 0.003, 0, 1)), t0, gain, pan)


def kick(t0, gain, bus=None, f0=110, f1=42, dec=0.32):
    t = tt(0.9)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / dec)
    y += 0.25 * filt(rng.standard_normal(len(t)), "bp", 2500, 1.2) * np.exp(-t / 0.004)
    place(bus, fade(np.tanh(1.4 * y), 0.0005, 0.05), t0, gain)


def hat(t0, gain, pan=0.0, dec=0.035, bus=None):
    t = tt(0.25)
    y = filt(filt(rng.standard_normal(len(t)), "hp", 7000), "peak", 10500, 1.5, 4) * np.exp(-t / dec)
    place(bus, fade(y, 0.0005, 0.02), t0, gain, pan)


def tom(t0, f, gain, bus=None, pan=0.0):
    t = tt(1.0)
    ff = f * (1 + 0.6 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t / 0.28)
    y += 0.15 * filt(rng.standard_normal(len(t)), "bp", f * 4, 2) * np.exp(-t / 0.05)
    place(bus, fade(y, 0.0005, 0.05), t0, gain, pan)


def noise_sweep(t0, dur, f0, f1, gain, q=1.2, shape=2.0, bus=None, pan0=0.0, pan1=0.0, curve="up"):
    t = tt(dur)
    u = t / dur
    fc = f0 * (f1 / f0) ** u
    env = (u**shape) if curve == "up" else ((1 - u) ** shape if curve == "down" else np.sin(np.pi * u) ** shape)
    y = tv_filter(rng.standard_normal(len(t)), "bp", fc, q) * env
    a = (np.linspace(pan0, pan1, len(t)) + 1) * np.pi / 4
    place(bus, fade(np.stack([y * np.cos(a), y * np.sin(a)], axis=1), 0.01, 0.03), t0, gain)


def click(t0, gain, f=3200, q=3, dec=0.006, pan=0.0, bus=None):
    t = tt(0.08)
    y = filt(rng.standard_normal(len(t)), "bp", f, q) * np.exp(-t / dec)
    place(bus, fade(y, 0.0002, 0.01), t0, gain, pan)


def ring(t0, freqs, gain, dec=0.35, pan=0.0, bus=None):
    t = tt(dec * 5)
    y = sum(np.sin(2 * np.pi * f * t + i) * np.exp(-t / (dec / (1 + 0.3 * i))) for i, f in enumerate(freqs))
    place(bus, fade(y / len(freqs), 0.001, 0.05), t0, gain, pan)


def boom(t0, gain, f0=62, f1=30, dec=1.6, bus=None):
    t = tt(dec * 3.5)
    f = f1 + (f0 - f1) * np.exp(-t / 0.18)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec)
    y = np.tanh(1.8 * y)
    y += 0.35 * filt(rng.standard_normal(len(t)), "lp", 900) * np.exp(-t / 0.12)
    place(bus, fade(y, 0.001, 0.2), t0, gain)


# ------------------------------------------------------------------ cues
def read_cues():
    src = open(TIMELINE, encoding="utf-8").read()
    block = src[src.index("export const CUES") :]
    block = block[: block.index("];")]
    cues = []
    for m in re.finditer(r"\{([^}]*)\}", block):
        d = {}
        for k, v in re.findall(r"(\w+):\s*(\"[^\"]*\"|[\d.]+)", m.group(1)):
            d[k] = v.strip('"') if v.startswith('"') else float(v)
        cues.append(d)
    return cues


def sfx(cue, B):
    k, t0 = cue["k"], cue["t"]
    if k == "sub_swell":
        t = tt(1.6)
        y = np.sin(2 * np.pi * 38 * t) * (t / 1.6) ** 2 * np.clip((1.6 - t) / 0.5, 0, 1)
        place(B, y, t0, 0.35)
    elif k == "core_pulse":
        for i, a in enumerate([0.0, 0.42]):
            t = tt(0.9)
            y = np.sin(2 * np.pi * 98 * t) * np.exp(-t / 0.22) * np.clip(t / 0.01, 0, 1)
            y += 0.3 * filt(rng.standard_normal(len(t)), "bp", 900, 0.8) * np.exp(-t / 0.08)
            place(B, y, t0 + 0.12 + a, 0.16 * (0.6 + 0.4 * i))
    elif k == "activate":
        # heavy studio light switching on, then a crystalline bloom
        kick(t0, 0.5, B, f0=90, f1=40, dec=0.25)
        click(t0, 0.5, 1800, 1.5, 0.012, bus=B)
        click(t0, 0.35, 5200, 3, 0.004, bus=B)
        for i, f in enumerate([note("D6"), note("A6"), note("E7"), note("F#7")]):
            bell(f, t0 + 0.06 + 0.035 * i, 0.07, dur=2.6, pan=(-0.5 + i * 0.33), bus=B)
        noise_sweep(t0 + 0.05, 1.4, 9000, 5000, 0.05, q=2.5, curve="down", bus=B, pan0=-0.4, pan1=0.4)
        t = tt(2.2)
        hum = (np.sin(2 * np.pi * 100 * t) + 0.3 * np.sin(2 * np.pi * 200 * t)) * np.exp(-t / 0.9) * np.clip(t / 0.05, 0, 1)
        place(B, hum, t0, 0.025)
    elif k in ("whoosh_in", "whoosh_out"):
        noise_sweep(t0, 0.32 if k == "whoosh_in" else 0.9, 500 if k == "whoosh_in" else 2500, 3500 if k == "whoosh_in" else 400, 0.22, q=0.9, curve="up" if k == "whoosh_in" else "down", bus=B, pan0=-0.6, pan1=0.6)
    elif k == "cut_tick":
        click(t0, 0.28, 4200, 4, 0.004, bus=B)
    elif k == "cut_low":
        kick(t0, 0.45, B, f0=80, f1=38, dec=0.3)
    elif k == "process":
        for i in range(int(cue.get("n", 4))):
            ti = t0 + i * cue.get("every", 0.5)
            click(ti, 0.12, 2400 + 400 * (i % 3), 6, 0.01, pan=0.3 * np.sin(i * 1.7), bus=B)
            ring(ti, [note("A6"), note("E7")], 0.018, dec=0.12, pan=0.2, bus=B)
    elif k == "fly":
        d = cue.get("dur", 3)
        noise_sweep(t0, d, 300, 1400, 0.12, q=0.6, shape=0.6, curve="arc", bus=B, pan0=-0.2, pan1=0.2)
        for i in range(12):  # towers passing
            ti = t0 + 0.12 + i * 0.24 + 0.03 * np.sin(i)
            noise_sweep(ti, 0.26, 700, 2600, 0.06, q=1.4, shape=1.5, curve="arc", bus=B, pan0=(-1) ** i * 0.8, pan1=(-1) ** i * -0.2)
        for i in range(24):  # low mechanical rhythm, 16ths
            tom(t0 + i * 0.125, 55 if i % 4 == 0 else 70, 0.07 if i % 4 == 0 else 0.03, bus=B)
    elif k == "data":
        notes = [note(n) for n in ["D6", "A5", "F6", "E6", "A6", "D7", "C6", "G6", "F#6"]]
        for i in range(int(cue.get("n", 8))):
            ti = t0 + i * cue.get("every", 0.3)
            t = tt(0.16)
            f = notes[i % len(notes)]
            y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.035) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.02)
            place(B, fade(y, 0.001, 0.02), ti, 0.05, pan=np.sin(i * 2.3) * 0.7)
            click(ti, 0.05, 6000, 5, 0.003, pan=np.sin(i * 2.3) * 0.7, bus=B)
    elif k == "flicker":
        for i in range(9):
            ti = t0 + 0.06 * i + 0.02 * rng.random()
            click(ti, 0.06 * rng.uniform(0.5, 1), rng.uniform(1500, 5000), 2, 0.003, pan=0.5, bus=B)
        t = tt(0.5)
        place(B, np.sin(2 * np.pi * 120 * t) * (np.sin(2 * np.pi * 31 * t) > 0.3) * np.exp(-t / 0.3), t0, 0.02, 0.5)
    elif k == "impact_low":
        boom(t0, 0.38, 58, 30, 0.9, bus=B)
    elif k == "warning":
        # one precise warning tone: clean, slightly beating, short
        t = tt(1.4)
        f = note("Bb5")
        y = (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * (f * 1.0595) * t) + 0.2 * np.sin(2 * np.pi * f * 2 * t)) * np.exp(-t / 0.42) * np.clip(t / 0.004, 0, 1)
        place(B, fade(y), t0, 0.06, -0.2)
        place(B, fade(y), t0 + 0.012, 0.035, 0.4)
    elif k == "risk_tick":
        t = tt(0.6)
        y = np.sin(2 * np.pi * note("Bb4") * t) * np.exp(-t / 0.12) + 0.4 * np.sin(2 * np.pi * note("E5") * t) * np.exp(-t / 0.08)
        place(B, fade(y, 0.001), t0, 0.07, 0.35)
        click(t0, 0.08, 2600, 5, 0.004, bus=B)
    elif k == "scan":
        d = cue.get("dur", 1.8)
        t = tt(d)
        u = t / d
        f = note("A6") * (1 + 0.004 * np.sin(2 * np.pi * 5 * t))
        y = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)) * np.sin(np.pi * u) ** 0.6
        a = (np.linspace(-0.7, 0.7, len(t)) + 1) * np.pi / 4
        place(B, fade(np.stack([y * np.cos(a), y * np.sin(a)], axis=1), 0.05, 0.1), t0, 0.035)
        noise_sweep(t0, d, 2500, 9000, 0.05, q=4, shape=0.8, curve="arc", bus=B, pan0=-0.7, pan1=0.7)
        for i in range(14):
            click(t0 + i * d / 14, 0.035, 5500, 6, 0.002, pan=-0.7 + 1.4 * i / 14, bus=B)
    elif k == "isolate":
        click(t0, 0.16, 3600, 4, 0.004, bus=B)
        ring(t0, [note("E6"), note("B6")], 0.04, dec=0.18, bus=B)
    elif k == "lock":
        # mechanical lock: click transient, low thunk, short metallic ring
        click(t0, 0.42, 3000, 2.2, 0.006, bus=B)
        click(t0 + 0.012, 0.25, 1200, 2, 0.01, bus=B)
        kick(t0, 0.55, B, f0=95, f1=48, dec=0.16)
        ring(t0, [1180, 2950, 4710], 0.05, dec=0.22, pan=rng.uniform(-0.3, 0.3), bus=B)
    elif k == "reroute":
        t = tt(1.0)
        f = 220 * 2 ** (2 * t)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t) ** 1.5
        place(B, fade(y), t0, 0.03)
        noise_sweep(t0, 0.9, 800, 6000, 0.06, q=1.5, curve="arc", bus=B)
    elif k == "checkpoint_hold":
        click(t0, 0.2, 1500, 2, 0.01, bus=B)
        t = tt(0.55)
        place(B, fade(np.sin(2 * np.pi * note("D4") * t) * np.exp(-t / 0.4), 0.01, 0.1), t0, 0.05)
    elif k == "confirm":
        bell(note("A5"), t0, 0.11, dur=1.6, pan=-0.1, bus=B)
        bell(note("E6"), t0 + 0.11, 0.09, dur=1.8, pan=0.15, bus=B)
        click(t0, 0.12, 4200, 5, 0.003, bus=B)
    elif k == "record":
        for i in range(int(cue.get("n", 5))):
            ti = t0 + i * cue.get("every", 0.16)
            click(ti, 0.16, 2200 + 300 * i, 4, 0.006, bus=B)
            ring(ti, [note("D6") * 2 ** (i * 2 / 12)], 0.035, dec=0.09, pan=0.2, bus=B)
    elif k == "swell":
        d = cue.get("dur", 3.0)
        noise_sweep(t0, d - 0.6, 200, 3000, 0.07, q=0.7, shape=2.2, curve="up", bus=B)
    elif k == "power_down":
        # studio lights switching off, one bank after another
        for i, dt in enumerate([0.0, 0.16, 0.3]):
            click(t0 + dt, 0.3 - 0.06 * i, 1500, 1.5, 0.012, pan=(-0.5, 0.5, 0.0)[i], bus=B)
            kick(t0 + dt, 0.22 - 0.05 * i, B, f0=70, f1=40, dec=0.18)
        noise_sweep(t0, 0.8, 4000, 300, 0.05, q=0.8, curve="down", bus=B)
    elif k == "final_pulse":
        kick(t0, 0.35, B, f0=70, f1=36, dec=0.5)
        for i, f in enumerate([note("D6"), note("A6"), note("D7")]):
            bell(f, t0 + 0.05 * i, 0.04, dur=1.8, pan=(-0.4 + 0.4 * i), bus=B)
    elif k == "impact_final":
        # one deep cinematic impact: reverse build, boom, low tom, resonant tail
        t = tt(0.9)
        rev = filt(rng.standard_normal(len(t)), "lp", 3500) * (t / 0.9) ** 3
        place(B, rev, t0 - 0.9, 0.09)
        boom(t0, 0.55, 64, 29, 2.2, bus=B)
        tom(t0, 62, 0.28, bus=B)
        ring(t0, [note("D3"), note("A3"), note("D4")], 0.05, dec=1.2, bus=B)


# ------------------------------------------------------------------ score
def score(M):
    D = lambda n: note(n)
    beat = 0.5
    # 0-12: drone and air, opening slowly
    sub(D("D1"), 0.0, 12.4, 0.22, att=2.5, rel=0.4, bus=M)
    pad([D("D2"), D("A2")], 0.2, 12.2, lambda t: 220 + 900 * (t / 12.2) ** 1.6, 0.16, att=2.4, rel=0.35, bus=M)
    sine_pad([D("D5"), D("A5"), D("E6")], 1.0, 11.3, 0.045, att=1.6, rel=0.4, trem=0.25, bus=M)
    # 3-6: the perfect demo, a light glassy arpeggio on the beat
    arp = ["D4", "A4", "D5", "E5", "F5", "E5", "D5", "A4"]
    for i in range(12):
        pluck(D(arp[i % 8]), 3.0 + i * 0.25, 0.11 + 0.03 * (i % 2 == 0), pan=0.35 * np.sin(i * 0.9), dur=0.8, bright=0.35, bus=M)
    # 6-12: rhythm builds: 16th pluck sequence with rising brightness, sub kick on 1 and 3
    seq = ["D3", "D3", "A3", "D3", "F3", "D3", "A3", "C4", "D3", "D3", "A3", "D3", "E3", "D3", "A3", "Bb3"]
    for i in range(48):
        ti = 6.0 + i * 0.125
        g = 0.07 + 0.08 * (i / 48)
        pluck(D(seq[i % 16]), ti, g * (1.3 if i % 4 == 0 else 0.8), pan=0.25 * ((i % 2) * 2 - 1), dur=0.45, bright=0.2 + 0.5 * i / 48, bus=M)
    for b in range(12):
        kick(6.0 + b * 0.5, 0.2 if b % 2 == 0 else 0.11, M, f0=85, f1=40, dec=0.22)
        hat(6.25 + b * 0.5, 0.05 + 0.03 * (b / 12), pan=0.3, bus=M)
    # 12-15: the gaps. Pulse stops. Thin, dissonant, a slow heartbeat
    sub(D("D1"), 12.0, 3.2, 0.18, att=0.05, rel=0.6, bus=M)
    sine_pad([D("D5"), D("Eb5"), D("A5")], 12.05, 3.05, 0.06, att=0.5, rel=0.4, trem=0.4, bus=M)
    pad([D("D3"), D("Eb3")], 12.05, 3.1, lambda t: 380 + 120 * t, 0.07, att=0.7, rel=0.4, detune=11, bus=M)
    for b in range(3):
        kick(12.0 + b, 0.18, M, f0=60, f1=34, dec=0.35)
    # 15-21: purposeful. Dm Bb F C, pluck 8ths, measured percussion
    prog1 = [(15.0, ["D3", "F3", "A3", "D4"]), (16.5, ["Bb2", "D3", "F3", "Bb3"]), (18.0, ["F2", "C3", "F3", "A3"]), (19.5, ["C3", "E3", "G3", "C4"])]
    for t0, ch in prog1:
        pad([D(n) for n in ch], t0 - 0.05, 1.75, lambda t: 700 + 500 * t, 0.17, att=0.25, rel=0.3, bus=M)
        sub(D(ch[0]) / 2, t0, 1.55, 0.2, att=0.05, rel=0.2, bus=M)
    arp2 = {15.0: ["D4", "A4", "F4", "A4"], 16.5: ["D4", "F4", "Bb4", "F4"], 18.0: ["C4", "F4", "A4", "F4"], 19.5: ["C4", "E4", "G4", "E4"]}
    for t0, ns in arp2.items():
        for i in range(6):
            pluck(D(ns[i % 4]), t0 + i * 0.25, 0.08, pan=0.3 * ((i % 2) * 2 - 1), dur=0.6, bright=0.45, bus=M)
    for b in range(12):
        ti = 15.0 + b * 0.5
        kick(ti, 0.24 if b % 2 == 0 else 0.12, M, f0=95, f1=42, dec=0.25)
        if b % 2 == 1:
            tom(ti, 140, 0.08, bus=M, pan=-0.2)
        hat(ti + 0.25, 0.06, pan=0.35, bus=M)
        if ti >= 18.0:
            hat(ti + 0.125, 0.025, pan=-0.35, bus=M)
            hat(ti + 0.375, 0.025, pan=-0.35, bus=M)
    # 21-27: broad, confident crescendo. Bb F Gm A
    prog2 = [(21.0, ["Bb2", "F3", "Bb3", "D4", "F4"]), (22.5, ["F2", "C3", "F3", "A3", "C4"]), (24.0, ["G2", "D3", "G3", "Bb3", "D4"]), (25.5, ["A2", "E3", "A3", "C#4", "E4"])]
    for k, (t0, ch) in enumerate(prog2):
        pad([D(n) for n in ch], t0 - 0.05, 1.8, lambda t, k=k: 900 + 450 * k + 500 * t, 0.2 + 0.03 * k, att=0.3, rel=0.35, spread=1.0, bus=M)
        sub(D(ch[0]) / 2, t0, 1.6, 0.22, att=0.05, rel=0.2, bus=M)
        sine_pad([D(ch[2]) * 2, D(ch[3]) * 2], t0, 1.7, 0.04 + 0.01 * k, att=0.3, rel=0.4, bus=M)
    for b in range(11):
        ti = 21.0 + b * 0.5
        kick(ti, 0.26 if b % 2 == 0 else 0.15, M, f0=95, f1=42, dec=0.27)
        hat(ti + 0.25, 0.07, pan=0.35, bus=M)
        hat(ti + 0.125, 0.03, pan=-0.35, bus=M)
        hat(ti + 0.375, 0.03, pan=-0.35, bus=M)
        if b % 2 == 1:
            tom(ti, 150, 0.1, bus=M, pan=-0.2)
    for i in range(20):  # rising 16th plucks into the reveal
        ti = 24.0 + i * 0.125
        pluck(D(["G4", "D5", "Bb4", "D5", "A4", "E5", "C#5", "E5"][(i // 2) % 8]), ti, 0.05 + 0.04 * i / 20, pan=0.3 * np.sin(i), dur=0.4, bright=0.6, bus=M)
    # 26.35: lights go down; music holds a suspended A (sus4 -> 3) under the final pulse
    pad([D("A2"), D("D3"), D("E3"), D("A3")], 26.4, 1.85, lambda t: 1400 - 500 * t, 0.15, att=0.35, rel=0.25, bus=M)
    sub(D("A1"), 26.4, 1.8, 0.16, att=0.2, rel=0.3, bus=M)
    # 28.15: resolution. D major add9, wide, with a soft bell motif and a long tail
    res = ["D2", "A2", "D3", "F#3", "A3", "E4", "F#4", "A4"]
    pad([D(n) for n in res], 28.12, 4.6, lambda t: 2200 * np.exp(-t / 2.2) + 500, 0.26, att=0.06, rel=2.6, spread=1.0, bus=M)
    sub(D("D1"), 28.12, 4.2, 0.26, att=0.02, rel=2.5, bus=M)
    for i, n in enumerate(["D6", "A5", "F#6", "E6"]):
        bell(D(n), 28.2 + i * 0.25, 0.035, dur=2.4, pan=(-0.4, 0.4, -0.15, 0.2)[i], bus=M)


# ----------------------------------------------------------------- voice
def process_vo(vo):
    """Broadcast-style VO chain: HPF, warmth, presence, de-ess, compression."""
    x = filt(vo, "hp", 85, 0.7)
    x = filt(x, "lowshelf", 180, 0.7, 1.5)
    x = filt(x, "peak", 320, 1.0, -1.5)
    x = filt(x, "peak", 3200, 0.9, 2.0)
    x = filt(x, "highshelf", 9000, 0.7, 1.0)
    # de-ess: duck 5-9 kHz band when it spikes
    s = filt(x, "bp", 6800, 1.2)
    se = sosfilt(butter(2, 40, fs=SR, output="sos"), np.abs(s))
    ess = np.clip(1 - 2.5 * np.maximum(se - 0.025, 0), 0.55, 1)
    x = x - s * (1 - ess)
    # compressor (RMS, 3:1 above -20 dBFS, soft knee-ish), make-up gain
    env = np.sqrt(np.maximum(sosfilt(butter(2, 18, fs=SR, output="sos"), x**2), 0) + 1e-12)
    db = 20 * np.log10(env)
    over = np.maximum(db + 20, 0)
    g = 10 ** (-over * (1 - 1 / 3) / 20)
    x = x * g
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.5
    return x


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vo", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    M, B = stereo(), stereo()
    score(M)
    for c in read_cues():
        sfx(c, B)
    hall = reverb_ir(2.8, 0.025, 4200, 0.9)
    room = reverb_ir(0.9, 0.008, 6000, 0.7, seed=11)
    M = reverb(M, hall, 0.32)
    B = reverb(B, room, 0.18) * 1.0
    B = reverb(B, hall, 0.12)

    vo, sr = sf.read(a.vo)
    assert sr == SR, "vo must be 48 kHz"
    vo = process_vo(vo.astype(np.float64))
    V = np.zeros_like(M)
    V[: len(vo), 0] = vo
    V[: len(vo), 1] = vo
    V = reverb(V, reverb_ir(0.55, 0.006, 7000, 0.4, seed=3), 0.07)

    # VO ducks the music (about -6 dB) and lightly ducks the sound design
    env = sosfilt(butter(2, 6, fs=SR, output="sos"), np.abs(V[:, 0]))
    env = np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1)
    att = sosfilt(butter(1, 3, fs=SR, output="sos"), env)
    duck_m = 1 - 0.6 * np.clip(att * 1.4, 0, 1)
    duck_b = 1 - 0.35 * np.clip(att * 1.4, 0, 1)
    # bus levels: the voice leads, music sits well underneath, effects between
    M *= (MUSIC * duck_m)[:, None]
    B *= (SFX * duck_b)[:, None]
    V *= VOICE

    mix = M + B + V
    # master: clear subsonics, ease the 50-70 Hz build-up a little
    mix = filt(mix, "hp", 28, 0.7)
    mix = filt(mix, "lowshelf", 70, 0.7, -2.0)
    # end: let the tail resolve, gentle fade over the last 0.4 s
    mix = mix[:N]
    f = int(0.4 * SR)
    mix[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
    # bus glue: soft clip safety
    peak = np.max(np.abs(mix))
    mix = np.tanh(mix / peak * 1.15) / np.tanh(1.15) * 0.89
    for name, x in [("music", M[:N]), ("sfx", B[:N]), ("vo", V[:N]), ("mix", mix)]:
        sf.write(os.path.join(a.out, name + ".wav"), x.astype(np.float32), SR, subtype="FLOAT")
        print(f"wrote {name}.wav  peak {20*np.log10(np.max(np.abs(x))+1e-9):.1f} dBFS")


if __name__ == "__main__":
    main()
