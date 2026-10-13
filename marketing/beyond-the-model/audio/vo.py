"""Generate the voiceover with Kokoro-82M (Apache-2.0), fully offline.

Reads the ten lines and their start times from src/timeline.js, renders each
line, fits it inside its scene window (speeding up slightly only when a line
would overrun), and writes one 48 kHz mono track with every line in place.

usage:
  python3 audio/vo.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
      --voice am_michael --out .work/audio/vo.wav

--voice takes a name or a blend, e.g. "am_michael:0.7,bm_george:0.3".
Brand name pronunciation is set in PRONOUNCE below (IPA as Kokoro expects).
"""

import argparse
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
TIMELINE = os.path.join(HERE, "..", "src", "timeline.js")
SR_OUT = 48000
END = 30.0

# QUAICU: "KWAY-koo". Change this one string to change it everywhere.
PRONOUNCE = {"QUAICU": "kwˈeɪkuː"}


def read_lines():
    src = open(TIMELINE, encoding="utf-8").read()
    block = src[src.index("export const VO") : src.index("];", src.index("export const VO"))]
    out = [(float(a), t) for a, t in re.findall(r'at:\s*([\d.]+),\s*text:\s*"([^"]+)"', block)]
    if len(out) != 10:
        sys.exit(f"expected 10 VO lines in timeline.js, found {len(out)}")
    return out


def voice_vec(voices, spec):
    """'am_michael' or a weighted blend 'am_michael:0.7,bm_george:0.3'."""
    parts = []
    for p in spec.split(","):
        name, _, w = p.partition(":")
        parts.append((name.strip(), float(w) if w else 1.0))
    total = sum(w for _, w in parts)
    return sum(voices[n] * (w / total) for n, w in parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=0.96, help="base delivery speed (1.0 = model default)")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    from kokoro_onnx import Kokoro

    k = Kokoro(a.model, a.voices)
    voices = np.load(a.voices)
    style = voice_vec(voices, a.voice)
    lines = read_lines()
    track = np.zeros(int(END * SR_OUT) + SR_OUT, dtype=np.float32)
    report = []
    for i, (at, text) in enumerate(lines):
        nxt = lines[i + 1][0] if i + 1 < len(lines) else END - 0.12
        window = nxt - at - 0.12
        ph = k.tokenizer.phonemize(text, "en-us")
        for word, ipa in PRONOUNCE.items():
            ph = ph.replace(k.tokenizer.phonemize(word, "en-us"), ipa)
        speed = a.speed
        for _ in range(8):
            audio, sr = k.create(ph, voice=style, speed=speed, is_phonemes=True, trim=True, sentence_pause=0.22)
            dur = len(audio) / sr
            if dur <= window or speed >= 1.3:
                break
            speed = min(1.3, speed * (dur / window) * 1.01)
        y = resample_poly(audio.astype(np.float64), SR_OUT, sr).astype(np.float32)
        # 6 ms fades so no line starts or ends on a click
        f = int(0.006 * SR_OUT)
        y[:f] *= np.linspace(0, 1, f)
        y[-f:] *= np.linspace(1, 0, f)
        s0 = int(at * SR_OUT)
        track[s0 : s0 + len(y)] += y
        report.append({"at": at, "text": text, "phonemes": ph, "speed": round(speed, 3), "dur": round(len(y) / SR_OUT, 3), "window": round(window, 3)})
        print(f"{at:6.2f}s  {len(y)/SR_OUT:4.2f}s / {window:4.2f}s  x{speed:.2f}  {text}")
    track = track[: int(END * SR_OUT)]
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    sf.write(a.out, track, SR_OUT, subtype="FLOAT")
    with open(os.path.splitext(a.out)[0] + ".json", "w") as fp:
        json.dump({"voice": a.voice, "lines": report}, fp, indent=2, ensure_ascii=False)
    print("wrote", a.out)


if __name__ == "__main__":
    main()
