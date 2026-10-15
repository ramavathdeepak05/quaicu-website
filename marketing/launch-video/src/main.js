// Stage bootstrap.
//   ?cut=16x9-60        which cut to build (see cuts.js)
//   ?video=V01          a Month Twelve campaign video, 4:5 (see campaign/videos.js)
//   &timing=<base64>    the voice-first plan from render.mjs (measured phrase
//                       lengths); without it the page estimates from word counts
//   &guides=1           draw the 9:16 ad safe zone
//   &play=1             preview in real time in a normal browser
//
// The renderer calls window.seek(t) once per frame and screenshots #stage.

import { CUTS, BEAT } from "./cuts.js";
import { SCENES } from "./scenes/index.js";
import { buildBackground } from "./background.js";
import { buildChrome } from "./chrome.js";
import { VIDEOS } from "./campaign/videos.js";
import { CAMPAIGN_SCENES } from "./campaign/scenes/index.js";
import { buildCampaignChrome } from "./campaign/chrome.js";
import { spring } from "./campaign/scenes/common.js";
import { planTiming } from "./campaign/timing.js";
import { buildZChrome, zTransition } from "./campaign/z/stage.js";
import { Z_SCENES } from "./campaign/z/scenes.js";

export const DIMS = { "16x9": [1920, 1080], "9x16": [1080, 1920], "4x5": [1080, 1350] };

const q = new URLSearchParams(location.search);
const videoId = q.get("video");
const cutId = videoId || q.get("cut") || "16x9-60";
const cut = videoId ? campaignCut(videoId) : CUTS[cutId];
if (!cut) throw new Error("Unknown cut " + cutId);
const fmt = cut.format;
const REGISTRY = videoId ? (cut.style === "z" ? { ...CAMPAIGN_SCENES, ...Z_SCENES } : CAMPAIGN_SCENES) : SCENES;

// A campaign video as a cut: 4:5, timed voice-first (each scene as long as
// its narration), the first scene starts complete so the hook reads on frame
// 0, and each scene names its music section for the score. Scenes get
// opts.voAt (seconds into the scene when each of their phrases starts) so
// animations can land with the words.
function campaignCut(id) {
  const v = VIDEOS[id];
  if (!v) return null;
  const given = q.get("timing");
  const plan = given ? JSON.parse(atob(given.replace(/-/g, "+").replace(/_/g, "/"))) : planTiming(v);
  const scenes = v.scenes.map(([name, , opts = {}], i) => {
    const section = opts.section || (name === "endcard" ? "outro" : i === 0 ? "lift" : "drive");
    const sc = plan.scenes[i];
    // opts.animateIn lets an opening scene play its entry instead of starting complete.
    return [name, sc.dur / BEAT, { ...opts, first: i === 0 && !opts.animateIn, section, voAt: sc.voAt, voDur: sc.voDur || [], voEnd: sc.voEnd }];
  });
  return { format: "4x5", scenes, num: v.badge || id.replace(/^V/, ""), phrases: plan.phrases, style: v.style || "" };
}

const stage = document.getElementById("stage");
stage.className = "f-" + fmt + (cut.style ? " " + cut.style : "");
// Zelios-style videos ("z"): scenes overlap during transitions instead of
// cutting. Each scene enters with opts.enter ("blur" | "mask" | "zoom" |
// "push") over opts.enterDur seconds, straddling its start.
const Z = cut.style === "z";
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
    if (!REGISTRY[name]) throw new Error("Unknown scene " + name);
    const scene = REGISTRY[name].build({ ...ctxBase, dur, opts });
    // Campaign scenes sit inside a camera layer that punches in on each cut
    // and keeps pushing in slowly while the scene holds.
    if (videoId) {
      const cam = document.createElement("div");
      cam.className = "cam";
      cam.append(scene.el);
      scene.cam = cam;
    }
    const holder = scene.cam || scene.el;
    holder.style.display = "none";
    root.append(holder);
    const tin = Z && start > 0 ? (opts.enterDur != null ? opts.enterDur : 0.5) : 0;
    timeline.push({ name, start, dur, scene, section: opts.section, opts, tin, enter: opts.enter || "blur" });
    start += dur;
  }
  const duration = start;
  // Each scene stays visible through the next scene's transition.
  timeline.forEach((s, i) => (s.tout = timeline[i + 1] ? timeline[i + 1].tin : 0));
  const chromeEl = document.getElementById("chrome");
  const chrome = Z
    ? buildZChrome(chromeEl, { num: cut.num, timeline, duration })
    : videoId
    ? buildCampaignChrome(chromeEl, { num: cut.num, timeline, duration })
    : buildChrome(chromeEl, { ...ctxBase, timeline });

  // Images must be decoded before the first screenshot.
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));

  const cues = [];
  for (const s of timeline) {
    cues.push({ t: s.start, type: "scene", scene: s.name, dur: s.dur });
    for (const c of s.scene.cues ? s.scene.cues() : []) {
      cues.push({ ...c, t: +(s.start + c.t).toFixed(4), scene: s.name });
    }
  }
  // Campaign narration, from the voice-first plan (the score ducks under it).
  for (const p of cut.phrases || []) cues.push({ t: p.t, type: "vo", text: p.text, dur: p.dur });
  cues.sort((a, b) => a.t - b.t);

  window.seek = (t) => {
    bg.update(t);
    if (Z) {
      for (const s of timeline) {
        const lt = t - s.start;
        const on = lt >= -s.tin / 2 && lt < s.dur + s.tout / 2;
        s.scene.cam.style.display = on ? "" : "none";
        if (on) {
          s.scene.update(Math.max(0, lt));
          zTransition(s, lt);
        }
      }
      chrome.update(t);
      return;
    }
    for (const s of timeline) {
      const lt = t - s.start;
      const on = lt >= 0 && lt < s.dur;
      (s.scene.cam || s.scene.el).style.display = on ? "" : "none";
      if (on) {
        s.scene.update(lt);
        if (s.scene.cam) {
          const punch = s.start > 0 ? 0.07 * (1 - spring(lt, 0, 1.6, 0.75)) : 0;
          const push = 0.035 * (lt / s.dur);
          s.scene.cam.style.transform = `scale(${1 + punch + push})`;
        }
      }
    }
    chrome.update(t);
  };

  window.__meta = {
    cut: cutId,
    format: fmt,
    duration,
    width: DIMS[fmt][0],
    height: DIMS[fmt][1],
    scenes: timeline.map(({ name, start, dur, section }) => ({ name, start, dur, ...(section ? { section } : {}) })),
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
