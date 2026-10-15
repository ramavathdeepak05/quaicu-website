// Shared helpers for the campaign scenes.
//
// Every scene receives { dur, opts }. opts.first is set on a video's opening
// scene: its entry animation is treated as already finished, so the hook is
// readable on frame 0 (LinkedIn autoplays muted and uses the first frame).
//
// Motion rules (from the reference prompts): springs with a small overshoot,
// entries snapped to the 120 BPM grid, something new on every beat, no slow
// fades. Every value is a pure function of t.

import { h, clamp } from "../../lib.js";

export const BEAT = 0.5;
// Snap a time to the nearest eighth note, so entries land on the music.
export const snap = (t) => Math.round(t / (BEAT / 2)) * (BEAT / 2);

// Seconds added to t for entry animations, so an opening scene starts complete.
export const entryShift = (opts) => (opts.first ? 30 : 0);

// Closed-form damped spring step response: 0 before t0, then rises to 1 with
// a small overshoot. f = natural frequency (Hz), z = damping ratio.
export function spring(t, t0, f = 2.4, z = 0.62) {
  const x = t - t0;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * f;
  const wd = w * Math.sqrt(1 - z * z);
  const v = 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + ((z * w) / wd) * Math.sin(wd * x));
  return x > 3 ? 1 : v;
}

// Pop an element in on a spring: rises, scales up slightly, fades in fast.
export function pop(el, t, at, { dy = 60, dx = 0, s0 = 0.94, f = 2.6 } = {}) {
  const p = spring(t, at, f);
  const o = clamp((t - at) / 0.12);
  el.style.opacity = o;
  if (t >= at + 2.5) { el.style.transform = ""; return 1; }
  el.style.transform = `translate3d(${(1 - p) * dx}px, ${(1 - p) * dy}px, 0) scale(${s0 + (1 - s0) * p})`;
  return p;
}

// Fast exit over the last d seconds (the wipe covers the cut).
export function exit(el, t, dur, d = 0.22) {
  const q = clamp((t - (dur - d)) / d);
  if (q <= 0) return;
  el.style.opacity = 1 - q;
}

// "text" | { text, dim } -> { text, dim }
export const row = (r) => (typeof r === "string" ? { text: r, dim: false } : { dim: false, ...r });

// Optional source line and caption at fixed positions above the player controls.
export function extras(el, opts) {
  const src = opts.source ? h("div", "c-src", opts.source) : null;
  const cap = opts.caption ? h("div", "c-caption", opts.caption) : null;
  if (src) el.append(src);
  if (cap) el.append(cap);
  return (t, te, capAt = 0.6) => {
    if (src) pop(src, te, 0.3, { dy: 16, s0: 1 });
    if (cap) pop(cap, t, snap(capAt), { dy: 40 });
  };
}

// Word-by-word lines. Words wrapped in *asterisks* get a green block that
// draws in behind them once they land. Returns [{ el, line, dim, mk }].
export function wordLines(parent, rows, cls = "c-line") {
  const words = [];
  rows.map(row).forEach((r, li) => {
    const ln = h("div", cls + (r.dim ? " dim" : ""));
    const tokens = r.text.match(/\*[^*]+\*|\S+/g) || [];
    tokens.forEach((tok, ti) => {
      const hl = tok.startsWith("*");
      const parts = hl ? tok.slice(1, -1).split(" ") : [tok];
      parts.forEach((w, wi) => {
        const s = h("span", "w" + (hl ? " hlw" : ""), hl ? `<span class="mk"></span>${w}` : w);
        ln.append(s);
        if (wi < parts.length - 1 || ti < tokens.length - 1) ln.append(document.createTextNode(" "));
        words.push({ el: s, line: li, dim: r.dim, mk: hl ? s.querySelector(".mk") : null });
      });
    });
    parent.append(ln);
  });
  return words;
}

// Schedule word reveals: quick stagger, a beat between lines.
export function scheduleWords(words, t0, budget) {
  const n = words.length;
  const stagger = Math.min(0.065, budget / Math.max(1, n + 4));
  let t = t0, prevLine = 0;
  return words.map((w) => {
    if (w.line !== prevLine) t = Math.max(t + stagger * 2, snap(t + 0.12));
    prevLine = w.line;
    const at = t;
    t += stagger;
    return at;
  });
}

export function revealWord(w, t, at, hlAt) {
  pop(w.el, t, at, { dy: 70, s0: 0.9, f: 2.8 });
  if (w.mk) {
    const p = clamp((t - hlAt) / 0.22);
    const e = 1 - Math.pow(1 - p, 3);
    w.mk.style.transform = `scaleX(${e})`;
    w.el.classList.toggle("on", p >= 0.98);
  }
}
