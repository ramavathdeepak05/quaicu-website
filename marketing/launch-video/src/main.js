// Stage bootstrap.
//   ?cut=16x9-60        which cut to build (see cuts.js)
//   &guides=1           draw the 9:16 ad safe zone
//   &play=1             preview in real time in a normal browser
//
// The renderer calls window.seek(t) once per frame and screenshots #stage.

import { CUTS, BEAT } from "./cuts.js";
import { VO } from "./copy.js";
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
  // The second argument pulls in the latin-ext files too (for ₹).
  await Promise.all(faces.map((f) => document.fonts.load(f, "A₹")));
  await document.fonts.ready;
}

// Voiceover line timings from tools/split_vo.py (audio/vo/<take>.json).
// Without that file the video still renders, just without voice sync.
async function loadVo(take) {
  if (!take) return null;
  try {
    const res = await fetch(`../audio/vo/${take}.json`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const lastSentence = (text) => text.split(/(?<=[.?!])\s+/).pop();

// Place each voiceover line at its scene (scene start + voAt), never
// overlapping the previous line.
function placeVo(plan, take, voData) {
  const placed = [];
  let prevEnd = -1;
  for (const s of plan) {
    if (s.opts.vo == null || !voData) continue;
    const line = voData.lines[s.opts.vo];
    if (!line) continue;
    const part = s.opts.voPart === "last" ? line.segs[line.segs.length - 1] : [line.start, line.end];
    const segs = s.opts.voPart === "last" ? [part] : line.segs;
    const at = Math.max(s.start + (s.opts.voAt ?? 0.12), prevEnd + 0.1);
    const off = at - part[0];
    const text = VO[take][s.opts.vo];
    placed.push({
      scene: s.name,
      at: +at.toFixed(3),
      end: +(part[1] + off).toFixed(3),
      src: [part[0], part[1]],
      segs: segs.map(([a, b]) => [+(a + off).toFixed(3), +(b + off).toFixed(3)]),
      text: s.opts.voPart === "last" ? lastSentence(text) : text,
    });
    prevEnd = part[1] + off;
  }
  return placed;
}

// Flag lines that start late, spill well into the next scene, or run off the end.
function voWarnings(plan, vo, duration) {
  const out = [];
  for (const v of vo) {
    const s = plan.find((p) => p.name === v.scene);
    const want = s.start + (s.opts.voAt ?? 0.12);
    if (v.at > want + 0.3) out.push(`${v.scene}: line starts ${(v.at - want).toFixed(2)}s late`);
    if (v.end > s.start + s.dur + 0.6) out.push(`${v.scene}: line runs ${(v.end - s.start - s.dur).toFixed(2)}s into the next scene`);
    if (v.end > duration - 0.15) out.push(`${v.scene}: line ends at ${v.end.toFixed(2)}s, past the end`);
  }
  return out;
}

async function main() {
  await loadFonts();

  const ctxBase = { fmt, cutId };
  const bg = buildBackground(stage.querySelector(".bg"), ctxBase);
  const root = document.getElementById("scenes");

  // Lay out the scenes on the beat grid, then place the voiceover on it.
  const plan = [];
  let start = 0;
  for (const [name, beats, opts = {}] of cut.scenes) {
    plan.push({ name, start, dur: beats * BEAT, opts });
    start += beats * BEAT;
  }
  const duration = start;
  const voData = await loadVo(cut.take);
  const vo = placeVo(plan, cut.take, voData);

  const timeline = [];
  for (const p of plan) {
    // Each scene gets its own voiceover line in scene time, to sync text to it.
    const v = vo.find((x) => x.scene === p.name);
    const sceneVo = v ? { at: v.at - p.start, end: v.end - p.start, segs: v.segs.map(([a, b]) => [a - p.start, b - p.start]) } : null;
    const scene = SCENES[p.name].build({ ...ctxBase, dur: p.dur, opts: p.opts, vo: sceneVo });
    scene.el.style.display = "none";
    root.append(scene.el);
    timeline.push({ name: p.name, start: p.start, dur: p.dur, scene });
  }
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
    take: voData ? cut.take : null,
    vo,
    warnings: voWarnings(plan, vo, duration),
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
