# QUAICU launch video

This is the source for the QUAICU launch ad. Four cuts are rendered from one set of scenes:

| Cut | Size | Length | Output |
|---|---|---|---|
| `16x9-60` | 1920x1080 | 60s | `out/quaicu-launch-16x9-60s.mp4` |
| `16x9-30` | 1920x1080 | 30s | `out/quaicu-launch-16x9-30s.mp4` |
| `9x16-30` | 1080x1920 | 30s | `out/quaicu-launch-9x16-30s.mp4` |
| `9x16-15` | 1080x1920 | 15s | `out/quaicu-launch-9x16-15s.mp4` |

All four are H.264 High at 30fps, BT.709, with AAC 48kHz stereo audio normalised to -14 LUFS. `COPY.md` has the post text, ad copy and which file goes where.

This directory is listed in the site's `.eleventyignore` and is not copied into `_site`, so nothing here is deployed.

## How it works

- **`src/`** is a web page that draws one frame of the video. `window.seek(t)` sets every animated value as a pure function of time, with no CSS animations or timers, so every frame can be rendered on its own.
- **`render.mjs`** opens the page in headless Chromium and screenshots each frame. It encodes the frames with ffmpeg in 5-second chunks across 4 workers, joins the chunks, then adds the soundtrack.
- **`audio/compose.py`** synthesises the music (120 BPM, D minor resolving to F) and the sound effects from the cue list the page exports: typing, approvals, ledger stamps, the logo hit and scene changes. The score is original, so it is safe for paid ads.

The look comes from the site: `og-card.png`, the tokens in `assets/site.css`, the "Delivery Activity" window on the home page, and the event names in `assets/site.js`. The logo is `assets/brand/logo-512.png`.

## Editing

- **Words:** all on-screen copy is in `src/copy.js`.
- **Timing and order:** `src/cuts.js` lists each cut's scenes with their length in beats (1 beat = 0.5s). Keep each cut's total at 30, 60 or 120 beats.
- **A scene:** `src/scenes/<name>.js` builds the scene's DOM and animates it in `update(t)`. Its layout is in `src/styles.css`, with `.f-9x16` overrides for vertical.

## Commands

```bash
npm install                      # playwright-core and the brand fonts
pip install numpy scipy          # for the score

node render.mjs --all            # render all four cuts into out/
node render.mjs --cut 9x16-15    # render one cut
node render.mjs --all --stills   # quick stills per scene into .work/stills/
node render.mjs --cut 9x16-30 --stills --guides   # show the Reels/Shorts safe zone
node render.mjs --thumbs         # YouTube thumbnail and Reels cover into out/
node render.mjs --all --score    # compose the soundtrack only

python3 tools/contact_sheet.py .work/stills/16x9-60 sheet.png   # tile stills for review
```

To preview in a browser, serve the repo root (for example `npx http-server ../..` from this folder) and open `/marketing/launch-video/src/index.html?cut=16x9-60&play=1`.

To use a licensed music track instead of the composed score, pass `--music track.wav`. It is trimmed to each cut's length and loudness-normalised the same way.

Chromium is found at `/opt/pw-browsers/chromium-*` or through `CHROME_PATH`. ffmpeg needs to be on the `PATH`.
