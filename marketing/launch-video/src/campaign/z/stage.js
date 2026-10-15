// Zelios-style stage pieces: scene transitions and the chrome.
//
// Scenes overlap instead of cutting. A scene's transition straddles its
// start: the incoming scene (drawn on top) arrives over [start - tin/2,
// start + tin/2] while the outgoing one reacts underneath. Styles:
//   blur  the incoming scene un-blurs and settles; the outgoing one softens
//   mask  the incoming scene is revealed through a growing rounded square
//         (the QUAICU logo shape); the outgoing one drifts forward
//   zoom  the camera flies through: outgoing scales up and blurs away,
//         incoming scales up from behind
//   push  the incoming scene slides up over the outgoing one
// Every scene also drifts in slowly (a 2.5% push over its length), so
// nothing is ever perfectly still.

import { clamp, LOGO_SRC } from "../../lib.js";

const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const blur = (px) => (px > 0.05 ? `blur(${px.toFixed(2)}px)` : "");
const W = 1080, H = 1350, CX = 540, CY = 640;

function maskClip(p) {
  // A rounded square grows from the logo's size until it covers the frame.
  const size = 110 + (Math.hypot(W, H) * 1.05 - 110) * p;
  const half = size / 2;
  const r = Math.max(0, Math.min(size * 0.26, 220) * (1 - p * p));
  const top = CY - half, left = CX - half, bottom = H - (CY + half), right = W - (CX + half);
  return `inset(${top.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${left.toFixed(1)}px round ${r.toFixed(1)}px)`;
}

export function zTransition(s, lt) {
  const cam = s.scene.cam;
  const drift = 1 + 0.025 * clamp(lt / s.dur, 0, 1.2);
  let scale = drift, ty = 0, filter = "", op = 1, clip = "";

  if (s.tin > 0 && lt < s.tin / 2) {
    const p = io(clamp((lt + s.tin / 2) / s.tin));
    if (s.enter === "mask") clip = p < 1 ? maskClip(p) : "";
    else if (s.enter === "zoom") { op = clamp(p * 1.6); filter = blur((1 - p) * 16); scale *= 0.8 + 0.2 * p; }
    else if (s.enter === "push") ty = (1 - p) * 100;
    else { op = clamp(p * 1.4); filter = blur((1 - p) * 22); scale *= 1.07 - 0.07 * p; }
  }
  if (s.tout > 0 && lt > s.dur - s.tout / 2) {
    const q = io(clamp((lt - (s.dur - s.tout / 2)) / s.tout));
    if (s.nextEnter === "zoom") { scale *= 1 + 0.4 * q; filter = blur(q * 18); op = 1 - q; }
    else if (s.nextEnter === "push") { ty = -24 * q; scale *= 1 - 0.05 * q; filter = `brightness(${(1 - 0.45 * q).toFixed(3)})`; }
    else if (s.nextEnter === "mask") { scale *= 1 + 0.08 * q; filter = blur(q * 8); }
    else { scale *= 1 - 0.05 * q; filter = blur(q * 14); }
  }
  cam.style.transform = `translate3d(0, ${ty.toFixed(2)}%, 0) scale(${scale.toFixed(4)})`;
  cam.style.filter = filter;
  cam.style.opacity = op;
  cam.style.clipPath = clip;
}

// Small wordmark top left, series label top right. Colours follow the
// current scene's tone (opts.tone "light" for bright scenes).
export function buildZChrome(el, { num, timeline, duration }) {
  el.className = "z-chrome";
  el.innerHTML = `
    <div class="z-mark"><img src="${LOGO_SRC}" alt=""><span>QUAICU</span></div>
    <div class="z-series">Month Twelve · ${num}</div>`;
  const end = timeline.find((s) => s.name === "endcard");
  const endAt = end ? end.start - end.tin / 2 : duration;
  timeline.forEach((s, i) => (s.nextEnter = timeline[i + 1] ? timeline[i + 1].enter : null));
  return {
    update(t) {
      let tone = "dark";
      for (const s of timeline) if (t >= s.start - s.tin / 2) tone = s.opts.tone || (s.opts.bg === "light" ? "light" : "dark");
      el.classList.toggle("on-light", tone === "light");
      el.style.opacity = 1 - clamp((t - endAt) / 0.4);
    },
  };
}
