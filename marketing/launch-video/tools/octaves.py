"""Print octave-band energy (dB, relative to the 500 Hz band) for time
windows of a WAV, to check the mix balance without listening.

usage: python3 tools/octaves.py file.wav start-end [start-end ...]
"""
import sys
import wave

import numpy as np
from scipy import signal

path = sys.argv[1]
with wave.open(path) as w:
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels()).mean(axis=1) / 32768
centres = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
print("window      " + " ".join(f"{c:>6}" for c in centres) + "   rms dBFS")
for win in sys.argv[2:]:
    a, b = map(float, win.split("-"))
    seg = x[int(a * sr):int(b * sr)]
    f, p = signal.welch(seg, sr, nperseg=8192)
    e = []
    for c in centres:
        m = (f >= c / 2 ** 0.5) & (f < c * 2 ** 0.5)
        e.append(10 * np.log10(p[m].sum() + 1e-20))
    ref = e[4]
    rms = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)
    print(f"{win:<11} " + " ".join(f"{v - ref:6.1f}" for v in e) + f"   {rms:6.1f}")
