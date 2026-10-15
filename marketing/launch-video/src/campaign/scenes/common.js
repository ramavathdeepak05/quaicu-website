// Shared helpers for the campaign scenes.
//
// Every scene receives { dur, opts }. opts.first is set on a video's opening
// scene: its entry animation is treated as already finished, so the hook is
// readable on frame 0 (LinkedIn autoplays muted and uses the first frame).

import { h, show, prog, ease } from "../../lib.js";

// Seconds added to t for entry animations, so an opening scene starts complete.
export const entryShift = (opts) => (opts.first ? 30 : 0);

// "text" | { text, dim } -> { text, dim }
export const row = (r) => (typeof r === "string" ? { text: r, dim: false } : { dim: false, ...r });

// Optional source line and caption at fixed positions above the player controls.
export function extras(el, opts) {
  const src = opts.source ? h("div", "c-src", opts.source) : null;
  const cap = opts.caption ? h("div", "c-caption", opts.caption) : null;
  if (src) el.append(src);
  if (cap) el.append(cap);
  return (t, te, capAt = 0.6) => {
    if (src) show(src, te, 0.3, 0.5, 8);
    if (cap) show(cap, t, capAt, 0.5, 14);
  };
}

// Words that rise into place one after another. Returns the per-word start
// times so callers can add cues.
export function wordLines(parent, rows, cls = "c-line") {
  const words = [];
  rows.map(row).forEach((r, li) => {
    const ln = h("div", cls + (r.dim ? " dim" : ""));
    r.text.split(" ").forEach((w, wi, arr) => {
      const s = h("span", "w", w);
      ln.append(s);
      if (wi < arr.length - 1) ln.append(document.createTextNode(" "));
      words.push({ el: s, line: li, dim: r.dim });
    });
    parent.append(ln);
  });
  return words;
}

// Schedule word reveals: steady stagger within a line, a short gap between
// lines and a longer pause before a dim (grey) line.
export function scheduleWords(words, t0, budget) {
  const n = words.length;
  const stagger = Math.min(0.11, budget / Math.max(1, n + 4));
  let t = t0, prevLine = 0, prevDim = false;
  return words.map((w) => {
    if (w.line !== prevLine) t += w.dim && !prevDim ? stagger * 4 : stagger * 1.5;
    prevLine = w.line;
    prevDim = w.dim;
    const at = t;
    t += stagger;
    return at;
  });
}

export function revealWord(el, t, at) {
  const p = prog(t, at, 0.55, ease.out);
  el.style.opacity = p;
  el.style.transform = p >= 1 ? "" : `translate3d(0, ${(1 - p) * 0.45}em, 0)`;
}
