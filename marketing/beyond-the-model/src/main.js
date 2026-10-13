// Boots the film page. window.seek(t) renders the frame at time t (seconds).
// Shots are built lazily the first time they are needed, so a render worker
// only pays for the shots in its own chunk.

import * as THREE from "three";
import { Post } from "./post.js";
import { makeEnvs } from "./env.js";
import { SHOTS, FPS, DURATION, CUES } from "./timeline.js";
import { overlay } from "./overlay.js";

const q = new URLSearchParams(location.search);
const W = +(q.get("w") || 1920);
const H = +(q.get("h") || 1080);

async function boot() {
  await Promise.all([300, 400, 500, 600].map((w) => document.fonts.load(`${w} 40px Inter`)));
  const canvas = document.getElementById("gl");
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 1);

  const envs = makeEnvs(renderer);
  const post = new Post(renderer, W, H);
  const ov = overlay(document.getElementById("overlay"));
  const built = new Map();
  const ctx = { renderer, envs, W, H, aspect: W / H };

  async function shotAt(i) {
    if (!built.has(i)) {
      const mod = await import(`./shots/${SHOTS[i].file}.js`);
      built.set(i, await mod.default(ctx));
    }
    return built.get(i);
  }

  window.seek = async (t) => {
    t = Math.max(0, Math.min(DURATION - 1e-6, t));
    let i = SHOTS.findIndex((s) => t >= s.start && t < s.start + s.dur);
    if (i < 0) i = SHOTS.length - 1;
    const s = SHOTS[i];
    const shot = await shotAt(i);
    const local = t - s.start;
    const look = shot.update(local, t) || {};
    post.render(shot.scene, shot.camera, look, Math.round(t * FPS));
    ov.update(t);
    return true;
  };
  window.__shots = built; // for debugging scripts
  window.__meta = { fps: FPS, duration: DURATION, shots: SHOTS, cues: CUES, w: W, h: H };
  // Pre-build the first requested shot so the first frame is not slow.
  const warm = q.get("warm");
  if (warm !== null) await shotAt(+warm);
  window.__ready = true;
}

boot().catch((e) => {
  console.error(e);
  window.__error = String(e && e.stack ? e.stack : e);
});
