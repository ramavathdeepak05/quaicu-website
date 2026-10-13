#!/usr/bin/env bash
# Build the soundtrack: voiceover (Kokoro, offline) then score, sound design
# and mix. Needs: pip install kokoro-onnx soundfile scipy numpy
# and the model files from audio/fetch_kokoro.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
VOICE="${VOICE:-am_michael}"
K=.work/kokoro
python3 audio/vo.py --model "$K/kokoro-v1.0.onnx" --voices "$K/voices-v1.0.bin" --voice "$VOICE" --out .work/audio/vo_raw.wav
python3 audio/score.py --vo .work/audio/vo_raw.wav --out .work/audio
