"""Split a voiceover take into its lines (and the phrases inside each line).

usage: python3 tools/split_vo.py audio/vo/60.mp3 --lines 9

Lines are separated by the long pauses written into the TTS prompt
(<#1.2#>); phrases inside a line by its natural sentence and comma pauses.
Writes audio/vo/<take>.json next to the input:
  {"take": "60", "file": "60.mp3", "duration": s,
   "lines": [{"start": s, "end": s, "segs": [[s, e], ...]}, ...]}
"""
import argparse
import json
import os
import re
import subprocess


def silences(path, noise_db, min_dur):
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af", f"silencedetect=noise={noise_db}dB:d={min_dur}", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    hh, mm, ss = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr).groups()
    dur = int(hh) * 3600 + int(mm) * 60 + float(ss)
    if len(ends) < len(starts):
        ends.append(dur)
    return list(zip(starts, ends)), dur


def sounding(gaps, dur, lo=0.0, hi=None):
    """Turn silence intervals into sounding intervals within [lo, hi]."""
    hi = dur if hi is None else hi
    out, t = [], lo
    for a, b in gaps:
        if b <= lo or a >= hi:
            continue
        if a > t + 0.02:
            out.append([round(t, 3), round(min(a, hi), 3)])
        t = max(t, b)
    if t < hi - 0.02:
        out.append([round(t, 3), round(hi, 3)])
    # Ignore blips (encoder padding, breaths) shorter than 0.12s.
    return [x for x in out if x[1] - x[0] >= 0.12]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--lines", type=int, required=True, help="expected number of lines")
    ap.add_argument("--noise", type=float, default=-38)
    a = ap.parse_args()

    long_gaps, dur = silences(a.path, a.noise, 0.75)
    lines = sounding(long_gaps, dur)
    if len(lines) != a.lines:
        raise SystemExit(f"found {len(lines)} lines, expected {a.lines}: {lines}")
    short_gaps, _ = silences(a.path, a.noise, 0.14)
    out = []
    for s, e in lines:
        segs = sounding(short_gaps, dur, s, e) or [[s, e]]
        # Trim to the speech, with a little air so consonants are not clipped.
        s2, e2 = max(0.0, segs[0][0] - 0.03), min(dur, segs[-1][1] + 0.06)
        segs[0][0], segs[-1][1] = round(s2, 3), round(e2, 3)
        out.append({"start": round(s2, 3), "end": round(e2, 3), "segs": segs})

    take = os.path.splitext(os.path.basename(a.path))[0]
    res = {"take": take, "file": os.path.basename(a.path), "duration": round(dur, 3), "lines": out}
    dst = os.path.join(os.path.dirname(a.path), take + ".json")
    with open(dst, "w") as f:
        json.dump(res, f, indent=1)
    for i, l in enumerate(out):
        print(f"  line {i}: {l['start']:6.2f}-{l['end']:6.2f}  ({l['end'] - l['start']:.2f}s, {len(l['segs'])} phrases)")
    print("wrote", dst)


if __name__ == "__main__":
    main()
