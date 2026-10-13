# QUAICU: Beyond the Model

The source for the 30-second QUAICU brand film. The picture is real-time 3D (three.js) rendered frame by frame. The voiceover is an offline neural TTS. The score and sound design are synthesised in code. The repository holds no stock footage, samples or licensed music.

| File | What it is |
|---|---|
| `out/quaicu-beyond-the-model-30s-1080p.mp4` | Master: 1920x1080, 24 fps, H.264 High, BT.709, AAC 320k 48 kHz stereo at -14 LUFS |
| `out/poster-1920x1080.jpg` | Poster frame (the end card) |
| `out/still-*.jpg` | Key stills, one per scene |

This directory is under `marketing/`, which `.eleventyignore` excludes, so none of it is deployed with the site.

## The film

Ten 3-second shots, one continuous story: the AI looks ready, production exposes the gaps around it, QUAICU finds them and engineers the safeguards, and the environment is ready for the real world.

| Time | Scene | Voiceover |
|---|---|---|
| 0-3 | The Awakening: macro push across the core's circuitry, then the overhead beam reveal | The model works. |
| 3-6 | The Perfect Demo: the core and four modules in lockstep. Title: BEYOND THE MODEL. | The demo looks ready. |
| 6-9 | The Real World: forward track down an infrastructure corridor | But production is different. |
| 9-12 | The Hidden Connections: inside a glass data channel that branches to a data store, a tool and an unmonitored process | Data moves. Systems connect. |
| 12-15 | Governance Gaps: three amber risks (data leaving its boundary, an action path with no checkpoint, events with no record) | Hidden gaps appear. |
| 15-18 | The Diagnosis: a scanning plane maps the environment and isolates each risk | QUAICU finds them before deployment. |
| 18-21 | Engineering the Safeguards: policy gates, the data boundary, a review checkpoint and an evidence ledger lock into place. Title: ENGINEERED FOR REALITY. | We engineer boundaries and controls. |
| 21-24 | Human Control and Evidence: a transaction holds at REVIEW, is approved and is written to the ledger | Build human checkpoints. Capture evidence. |
| 24-27 | Real-World Readiness: pullback through the lanes into the white studio of the reference stills, then the lights go down | So AI can enter the real world. |
| 27-30 | The Reveal: the completed architecture, one last pulse, the end card | QUAICU. Engineered for safer deployment. |

End card: the official logo (`assets/brand/logo-512.png`), QUAICU, BUILT FOR SAFER DEPLOYMENT., quaicu.org.

Scenes 05, 06 and 07 share one environment (`src/shots/map.js`). The risks appear, get scanned and are fixed in exactly the same places.

## How it is made

- **Picture.** `src/index.html` is a page that draws one frame. `window.seek(t)` sets every value as a pure function of time, so any frame renders on its own and every run gives the same result. Each shot in `src/shots/` builds its own scene. The look lives in `src/kit.js` (frosted glass with edge light, obsidian, emerald emissives, gates, walls, ledger, the core) and `src/post.js` (4x MSAA HDR, bloom, a subtle anamorphic streak, half-res bokeh depth of field, ACES tone map, grain, vignette). Typography is HTML over the canvas (`src/overlay.js`, Inter).
- **Render.** `render.mjs` drives headless Chromium (software WebGL), screenshots each frame and encodes each shot, then joins them.
- **Voiceover.** `audio/vo.py` runs Kokoro-82M (Apache-2.0) offline with the `am_michael` voice. Each line starts at its time in `src/timeline.js` and is fitted inside its scene. QUAICU is pronounced "KWAY-koo". To change that, edit `PRONOUNCE` in `audio/vo.py`.
- **Score and sound.** `audio/score.py` composes the music (D minor, 120 BPM, resolving to D major on the logo) and the sound design from the cue list in `src/timeline.js`. It processes the voiceover (EQ, de-ess, compression, a short room) and mixes everything with the voice ducking the music.

## Commands

```bash
npm install
pip install numpy scipy soundfile kokoro-onnx

node render.mjs --stills --w 960 --h 540          # 3 quick stills per shot into .work/stills/
node render.mjs --stills --at 4.6,19.5            # stills at given times
node render.mjs --shots 7                         # re-render one shot (1-based)
node render.mjs                                   # whole film, 1920x1080 -> .work/1920x1080/video.mp4
node render.mjs --w 3840 --h 2160                 # 4K master (about 4x the time)

audio/fetch_kokoro.sh                             # voice model into .work/kokoro/ (npm packages)
audio/build.sh                                    # voiceover, score, sound design, mix -> .work/audio/
VOICE=bm_george audio/build.sh                    # same with another voice (or a blend: "am_michael:0.6,bm_george:0.4")

node render.mjs --mux                             # picture + mix -> out/ (two-pass loudness to -14 LUFS)
```

A 1080p frame takes about 4 to 6 seconds on a 4-core machine without a GPU, so the full film takes about 50 minutes on 4 workers. Chromium is found at `/opt/pw-browsers/chromium-*` or through `CHROME_PATH`. ffmpeg needs to be on the `PATH`.

## Editing

- **Words and timing:** `src/timeline.js` holds the voiceover lines and start times, the three typography moments and the sound cues.
- **A scene:** `src/shots/sNN_*.js`. Each one returns `{ scene, camera, update(t) }`, and `update` returns that frame's lens and grade (exposure, focus, aperture, bloom).
- **Brand colours:** `C` in `src/util.js`. Emerald `#0B8A54` and `#00C853`, obsidian `#0A0A0A`, graphite `#14171A`, soft white `#F7F7F5`. Amber-red is used only for the risk markers.
