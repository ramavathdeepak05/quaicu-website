# QUAICU launch video

This is the source for the QUAICU launch ad, aimed at small and medium businesses. It covers custom software, integrations with SAP, Salesforce and the rest, and AI workflows, with a person approving every change. Four cuts are rendered from one set of scenes:

| Cut | Size | Length | Output |
|---|---|---|---|
| `16x9-60` | 1920x1080 | 60s | `out/quaicu-launch-16x9-60s.mp4` |
| `16x9-30` | 1920x1080 | 30s | `out/quaicu-launch-16x9-30s.mp4` |
| `9x16-30` | 1080x1920 | 30s | `out/quaicu-launch-9x16-30s.mp4` |
| `9x16-15` | 1080x1920 | 15s | `out/quaicu-launch-9x16-15s.mp4` |

All four are H.264 High at 30fps, BT.709, with AAC 48kHz stereo audio normalised to -14 LUFS. `COPY.md` has the post text, ad copy, voiceover script, and which file goes where.

This directory is listed in the site's `.eleventyignore` and is not copied into `_site`, so nothing here is deployed.

## Story (60s)

| # | Scene | What it shows |
|---|---|---|
| 1 | `hook` | Orders in Salesforce, invoices in SAP, a person copying rows between them by hand |
| 2 | `tension` | An AI agent changing business data with no approver |
| 3 | `reveal` | "Introducing", then QUAICU: custom software, integrations and AI workflows for small and medium businesses |
| 4 | `build` | 01 Custom software: an order portal assembles and ships after review |
| 5 | `connect` | 02 Integrations: SAP, Salesforce, Zoho, Tally, HubSpot, QuickBooks, WhatsApp Business and any official API, with a live sync |
| 6 | `automate` | 03 AI workflows: an invoice read by AI, flagged by a rule, approved by the finance lead, posted to SAP |
| 7 | `pipeline` | Governance: AI proposes, rules enforce, humans approve, every action on record |
| 8 | `engage` | Start with one ticket or a full build, with one relationship manager |
| 9 | `endcard` | "Software you can answer for." and "Talk to us" with quaicu.org |

The 30s and 15s cuts are shorter versions of the same story. See `src/cuts.js`.

## How it works

- **`src/`** is a web page that draws one frame of the video. `window.seek(t)` sets every animated value as a pure function of time, with no CSS animations or timers, so every frame can be rendered on its own.
- **`render.mjs`** opens the page in headless Chromium and screenshots each frame. It encodes them with ffmpeg in 5-second chunks across 4 workers, joins the chunks, adds the soundtrack, and writes `.srt` captions when there is a voiceover.
- **`audio/compose.py`** synthesises the music and sound effects from the cue list the page exports. The music is 120 BPM, D minor resolving to F; it goes quiet for "Introducing", drops on the logo, and ducks under the voiceover. The music is original, so it is safe for paid ads.

The look comes from the site: `og-card.png`, the tokens in `assets/site.css`, the "Delivery Activity" window on the home page, and the row wording in `assets/site.js`. The logo is `assets/brand/logo-512.png`.

## Voiceover

The video is timed to a voiceover but renders fine without one; the on-screen text carries the message either way.

To add it:
1. Put the takes in `audio/vo/` as `60.mp3` (the 60s script, 9 lines) and `30.mp3` (the 30s script, 7 lines; the 15s cut reuses it). The script is in `COPY.md`. Leave a pause of about 1.2s between lines.
2. Split each take into lines:
   ```bash
   python3 tools/split_vo.py audio/vo/60.mp3 --lines 9
   python3 tools/split_vo.py audio/vo/30.mp3 --lines 7
   ```
3. Re-render. The page places each line at its scene (`vo` and `voAt` in `src/cuts.js`) and syncs the on-screen text to it. The score ducks under the voice, and captions are written next to each MP4.

`render.mjs` prints a warning if a line starts late or runs into the next scene. If that happens, give that scene more beats in `src/cuts.js`, taking them from a neighbour so the cut's total stays the same.

## Editing

- **Words:** all on-screen copy and the voiceover script are in `src/copy.js`.
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
python3 tools/octaves.py .work/16x9-60/score.wav 0-5 13-37      # check the mix balance
```

To preview in a browser, serve the repo root (for example `npx http-server ../..` from this folder) and open `/marketing/launch-video/src/index.html?cut=16x9-60&play=1`.

To use a licensed music track instead of the composed score, pass `--music track.wav`. It is trimmed to each cut's length and loudness-normalised the same way, but replaces the voiceover mix too.

Chromium is found at `/opt/pw-browsers/chromium-*` or through `CHROME_PATH`. ffmpeg needs to be on the `PATH`.
