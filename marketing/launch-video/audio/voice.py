#!/usr/bin/env python3
"""Voiceover for the Month Twelve campaign videos, with Kokoro (kokoro-onnx).

Reads the "vo" cues the page exports (one per narration line, timed to the
scene that shows the same words), synthesises each line, and lays them on a
timeline: a line starts at its cue, or just after the previous line if that
is still speaking. A line that would run past the next cue (or the end of the
video) is re-spoken faster, up to SPEED_MAX. Writes a 48kHz stereo WAV and an
SRT caption file with the times the lines were actually placed.

  python3 voice.py --cues .work/V01/cues.json --out vo.wav --srt V01.srt \
                   [--voice af_heart] [--speed 1.0] [--model-dir .kokoro]

The model files (kokoro-v1.0.onnx, voices-v1.0.bin) come from the
kokoro-onnx GitHub release "model-files-v1.0"; see README.md.
"""

import argparse
import json
import os

import numpy as np
from scipy.signal import resample_poly
import soundfile as sf

SR_OUT = 48000
GAP = 0.12        # minimum silence between lines (s)
TAIL = 0.25       # keep the last line clear of the very end (s)
SPEED_MAX = 1.3   # never faster than this; overflow is reported instead
HERE = os.path.dirname(os.path.abspath(__file__))


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def trim(x, thresh=1e-3):
    """Cut leading and trailing near-silence so placement is accurate."""
    idx = np.where(np.abs(x) > thresh)[0]
    if not len(idx):
        return x
    a = max(0, idx[0] - 240)
    b = min(len(x), idx[-1] + 2400)
    return x[a:b]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cues", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--srt")
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--model-dir", default=os.path.join(HERE, "..", ".kokoro"))
    a = ap.parse_args()

    from kokoro_onnx import Kokoro

    k = Kokoro(os.path.join(a.model_dir, "kokoro-v1.0.onnx"), os.path.join(a.model_dir, "voices-v1.0.bin"))
    lang = "en-gb" if a.voice.startswith("b") else "en-us"

    meta = json.load(open(a.cues))
    dur = meta["duration"]
    lines = sorted((c for c in meta["cues"] if c["type"] == "vo"), key=lambda c: c["t"])
    n = int(round(dur * SR_OUT))
    out = np.zeros(n, dtype=np.float32)
    subs = []
    prev_end = 0.0

    for i, c in enumerate(lines):
        start = max(c["t"], prev_end + GAP)
        limit = lines[i + 1]["t"] if i + 1 < len(lines) else dur - TAIL
        # Let a line run into the next scene's silence, but never past the next line's cue.
        limit = max(limit, start + 0.5)
        speed = a.speed
        while True:
            s, sr = k.create(c["text"], voice=a.voice, speed=speed, lang=lang)
            s = trim(np.asarray(s, dtype=np.float32))
            length = len(s) / sr
            if start + length <= limit or speed >= SPEED_MAX:
                break
            speed = min(SPEED_MAX, speed * (length / (limit - start)) * 1.02)
        if start + length > limit:
            print(f"  warning: line {i + 1} overruns by {start + length - limit:.2f}s at speed {speed:.2f}: {c['text']!r}")
        s48 = resample_poly(s, SR_OUT, sr).astype(np.float32)
        a0 = int(start * SR_OUT)
        b0 = min(n, a0 + len(s48))
        out[a0:b0] += s48[: b0 - a0]
        end = start + length
        subs.append((start, end, c["text"]))
        print(f"  {start:6.2f}-{end:6.2f}  x{speed:.2f}  {c['text']}")
        prev_end = end

    peak = np.max(np.abs(out)) or 1.0
    out = out / peak * 0.89  # about -1 dBFS; loudness is set when mixing
    sf.write(a.out, np.stack([out, out], axis=1), SR_OUT, subtype="PCM_16")

    if a.srt:
        with open(a.srt, "w", encoding="utf-8") as f:
            for j, (s0, s1, text) in enumerate(subs, 1):
                f.write(f"{j}\n{srt_time(s0)} --> {srt_time(s1 + 0.2)}\n{text}\n\n")


if __name__ == "__main__":
    main()
