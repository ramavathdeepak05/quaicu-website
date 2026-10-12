// Stage bootstrap.
//   ?cut=16x9-60        which cut to build (see cuts.js)
//   &guides=1           draw the 9:16 ad safe zone
//   &play=1             preview in real time in a normal browser
//
// The renderer calls window.seek(t) once per frame and screenshots #stage.

import { CUTS, BEAT } from "./cuts.js";
import { SCENES } from "./scenes/index.js";
import { buildBackground } from "./background.js";
import { buildChrome } from "./chrome.js";

const q = new URLSearchParams(location.search);
const cutId = q.get("cut") || "16x9-60";
const cut = CUTS[cutId];
if (!cut) throw new Error("Unknown cut " + cutId);
const fmt = cut.format;

const stage = document.getElementById("stage");
stage.className = "f-" + fmt;
if (q.get("guides")) stage.classList.add("show-guides");

async function loadFonts() {
  const faces = [
    '500 100px "Space Grotesk"', '700 100px "Space Grotesk"',
    '400 40px "Inter"', '500 40px "Inter"', '600 40px "Inter"', '700 40px "Inter"',
    '400 20px "JetBrains Mono"', '500 20px "JetBrains Mono"', '600 20px "JetBrains Mono"',
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f)));
  await document.fonts.ready;
}

async function main() {
  await loadFonts();

  const ctxBase = { fmt, cutId };
  const bg = buildBackground(stage.querySelector(".bg"), ctxBase);
  const root = document.getElementById("scenes");

  const timeline = [];
  let start = 0;
  for (const [name, beats, opts = {}] of cut.scenes) {
    const dur = beats * BEAT;
    const scene = SCENES[name].build({ ...ctxBase, dur, opts });
    scene.el.style.display = "none";
    root.append(scene.el);
    timeline.push({ name, start, dur, scene });
    start += dur;
  }
  const duration = start;
  const chrome = buildChrome(document.getElementById("chrome"), { ...ctxBase, timeline });

  // Images must be decoded before the first screenshot.
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));

  const cues = [];
  for (const s of timeline) {
    cues.push({ t: s.start, type: "scene", scene: s.name, dur: s.dur });
    for (const c of s.scene.cues ? s.scene.cues() : []) {
      cues.push({ ...c, t: +(s.start + c.t).toFixed(4), scene: s.name });
    }
  }
  cues.sort((a, b) => a.t - b.t);

  window.seek = (t) => {
    bg.update(t);
    for (const s of timeline) {
      const lt = t - s.start;
      const on = lt >= 0 && lt < s.dur;
      s.scene.el.style.display = on ? "" : "none";
      if (on) s.scene.update(lt);
    }
    chrome.update(t);
  };

  window.__meta = {
    cut: cutId,
    format: fmt,
    duration,
    width: fmt === "16x9" ? 1920 : 1080,
    height: fmt === "16x9" ? 1080 : 1920,
    scenes: timeline.map(({ name, start, dur }) => ({ name, start, dur })),
    cues,
  };
  window.seek(+(q.get("t") || 0));
  window.__ready = true;

  if (q.get("play")) {
    const t0 = performance.now();
    const tick = () => {
      const t = ((performance.now() - t0) / 1000) % duration;
      window.seek(t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

main().catch((err) => {
  window.__error = String(err && err.stack ? err.stack : err);
  console.error(err);
});
