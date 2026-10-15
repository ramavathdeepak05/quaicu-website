#!/usr/bin/env python3
"""Voiceover for the Month Twelve campaign videos, with Kokoro (kokoro-onnx).

The campaign is timed voice-first, in two steps driven by render.mjs:

  1. --synth phrases.json --cache DIR --durations out.json
     Speak every phrase, trim silence, cache each one as WAV (keyed by voice,
     speed and text, so re-renders are instant), and write the measured
     length of each phrase. render.mjs sizes the scenes from these lengths.

  2. --assemble timing.json --cache DIR --out vo.wav [--srt captions.srt]
     Lay the cached phrases on the timeline from timing.json (the plan made
     by src/campaign/timing.js) and write a 48 kHz stereo WAV and SRT.

Options: --voice af_heart, --speed 1.1, --model-dir .kokoro

The model files (kokoro-v1.0.onnx, voices-v1.0.bin) come from the
kokoro-onnx GitHub release "model-files-v1.0"; see README.md.
"""

import argparse
import hashlib
import json
import os

import numpy as np
from scipy.signal import resample_poly
import soundfile as sf

SR_OUT = 48000
HERE = os.path.dirname(os.path.abspath(__file__))


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def trim(x, sr, thresh=1e-3):
    """Cut leading and trailing near-silence so placement is accurate."""
    idx = np.where(np.abs(x) > thresh)[0]
    if not len(idx):
        return x
    a = max(0, idx[0] - int(0.01 * sr))
    b = min(len(x), idx[-1] + int(0.08 * sr))
    return x[a:b]


def key(voice, speed, text):
    return hashlib.sha1(f"{voice}|{speed:.3f}|{text}".encode()).hexdigest()[:16]


def synth(a):
    phrases = json.load(open(a.synth))
    os.makedirs(a.cache, exist_ok=True)
    kokoro = None
    lang = "en-gb" if a.voice.startswith("b") else "en-us"
    durs = []
    for p in phrases:
        path = os.path.join(a.cache, key(a.voice, a.speed, p["text"]) + ".wav")
        if not os.path.exists(path):
            if kokoro is None:
                from kokoro_onnx import Kokoro
                kokoro = Kokoro(os.path.join(a.model_dir, "kokoro-v1.0.onnx"), os.path.join(a.model_dir, "voices-v1.0.bin"))
            s, sr = kokoro.create(p["text"], voice=a.voice, speed=a.speed, lang=lang)
            s = trim(np.asarray(s, dtype=np.float32), sr)
            s48 = resample_poly(s, SR_OUT, sr).astype(np.float32)
            sf.write(path, s48, SR_OUT, subtype="FLOAT")
        info = sf.info(path)
        durs.append(round(info.frames / info.samplerate, 3))
        print(f"  {durs[-1]:5.2f}s  {p['text']}")
    json.dump(durs, open(a.durations, "w"))


def assemble(a):
    plan = json.load(open(a.assemble))
    dur = plan["duration"]
    n = int(round(dur * SR_OUT))
    out = np.zeros(n, dtype=np.float32)
    subs = []
    for p in plan["phrases"]:
        path = os.path.join(a.cache, key(a.voice, a.speed, p["text"]) + ".wav")
        s, _ = sf.read(path, dtype="float32")
        a0 = int(round(p["t"] * SR_OUT))
        b0 = min(n, a0 + len(s))
        out[a0:b0] += s[: b0 - a0]
        subs.append((p["t"], p["t"] + len(s) / SR_OUT, p["text"]))
    peak = float(np.max(np.abs(out))) or 1.0
    out = out / peak * 0.89  # about -1 dBFS; loudness is set when mixing
    sf.write(a.out, np.stack([out, out], axis=1), SR_OUT, subtype="PCM_16")
    if a.srt:
        with open(a.srt, "w", encoding="utf-8") as f:
            for j, (s0, s1, text) in enumerate(subs, 1):
                f.write(f"{j}\n{srt_time(s0)} --> {srt_time(s1 + 0.15)}\n{text}\n\n")
    # Report silences longer than half a second between phrases.
    gaps = [round(subs[i + 1][0] - subs[i][1], 2) for i in range(len(subs) - 1)]
    print(f"  {len(subs)} phrases, longest gap {max(gaps) if gaps else 0:.2f}s, voice ends {subs[-1][1]:.2f}s of {dur:.2f}s")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--synth", help="phrases.json: [{text}] to speak and measure")
    ap.add_argument("--durations", help="with --synth: write measured lengths here")
    ap.add_argument("--assemble", help="timing.json from src/campaign/timing.js")
    ap.add_argument("--out", help="with --assemble: output WAV")
    ap.add_argument("--srt")
    ap.add_argument("--cache", default=os.path.join(HERE, "..", ".work", "vo-cache"))
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.1)
    ap.add_argument("--model-dir", default=os.path.join(HERE, "..", ".kokoro"))
    a = ap.parse_args()
    if a.synth:
        synth(a)
    elif a.assemble:
        assemble(a)
    else:
        ap.error("pass --synth or --assemble")


if __name__ == "__main__":
    main()
