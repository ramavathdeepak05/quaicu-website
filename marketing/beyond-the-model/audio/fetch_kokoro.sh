#!/usr/bin/env bash
# Fetch the Kokoro-82M (Apache-2.0) ONNX weights and voice styles used for the
# voiceover into .work/kokoro/. The weights come from npm packages that carry
# the fp32 ONNX export split into shards; voices come from kokoro-local-runtime.
# Expected model SHA-256: 8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb
set -euo pipefail
cd "$(dirname "$0")/.."
D=.work/kokoro
mkdir -p "$D" && cd "$D"
for p in kokoro-fp32a-shards kokoro-fp32b-shards kokoro-fp32c-shards kokoro-local-runtime; do
  [ -d "$p" ] || { mkdir -p "$p" && npm pack "$p" --silent | xargs -I{} tar -xzf {} -C "$p"; }
done
cat kokoro-fp32a-shards/package/kokoro-fp32.part{0..6}.bin \
    kokoro-fp32b-shards/package/kokoro-fp32.part{7..13}.bin \
    kokoro-fp32c-shards/package/kokoro-fp32.part{14..18}.bin > kokoro-v1.0.onnx
echo "8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb  kokoro-v1.0.onnx" | sha256sum -c -
python3 - <<'PY'
import glob, os, numpy as np
v = {os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256) for f in glob.glob("kokoro-local-runtime/package/voices/*.bin")}
np.savez("voices.npz", **v)
os.replace("voices.npz", "voices-v1.0.bin")
print(len(v), "voices")
PY
