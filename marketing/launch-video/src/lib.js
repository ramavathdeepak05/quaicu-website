// Shared helpers: easing, tweening and small DOM builders.
//
// Every animated value in this project is a pure function of time. Nothing
// uses CSS transitions, timers or requestAnimationFrame, so any frame can be
// rendered on its own and always comes out the same.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;

// CSS-style cubic-bezier easing (x1, y1, x2, y2), solved with Newton steps
// and a bisection fallback.
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

export const ease = {
  brand: cubicBezier(0.2, 0.7, 0.2, 1), // the site's motion curve
  out: cubicBezier(0.16, 1, 0.3, 1),
  inOut: cubicBezier(0.65, 0, 0.35, 1),
  in: cubicBezier(0.5, 0, 0.75, 0),
  linear: (x) => x,
};

// Eased 0..1 progress of a tween that starts at t0 and lasts d seconds.
export const prog = (t, t0, d, e = ease.brand) => e(clamp((t - t0) / d));

export function backOut(x, s = 1.7) {
  const c = s + 1;
  return 1 + c * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
}

// Small seeded PRNG (mulberry32) for stable "random" details.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hex(r, n) {
  let s = "";
  for (let i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(r() * 16)];
  return s;
}

export function h(tag, cls, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
}

// Headline built from clipped lines that rise into place (the site's .m-split).
// rows: ["text", { text, cls }]
export function lines(parent, rows, cls = "") {
  const el = h("div", "lines " + cls);
  const inners = rows.map((row) => {
    const o = typeof row === "string" ? { text: row } : row;
    const ln = h("span", "ln");
    const inner = h("span", "ln-i " + (o.cls || ""), o.text);
    ln.append(inner);
    el.append(ln);
    return inner;
  });
  parent.append(el);
  return { el, inners };
}

export function rise(inners, t, t0, { stagger = 0.09, d = 0.8 } = {}) {
  inners.forEach((el, i) => {
    const p = prog(t, t0 + i * stagger, d, ease.out);
    el.style.transform = p >= 1 ? "" : `translate3d(0, ${(1 - p) * 112}%, 0)`;
  });
}

// Launch-style kinetic type: the element lands from 116% scale and a green
// underline flashes under it (CSS: .slam::after reads --u).
export function slam(el, t, t0, d = 0.38) {
  const p = clamp((t - t0) / d);
  el.style.opacity = clamp((t - t0) / 0.08);
  el.style.transform = p >= 1 ? "" : `scale(${1 + 0.16 * (1 - ease.out(p))})`;
  el.style.setProperty("--u", t >= t0 ? 1 - clamp((t - t0 - 0.1) / 0.7) : 0);
}

// Times (scene seconds) at which voiceover phrases start, or fallbacks.
export function voTimes(vo, n, fallback) {
  if (vo && vo.segs.length >= n) return vo.segs.slice(0, n).map((s) => s[0]);
  if (vo && n === 1) return [vo.at];
  return fallback;
}

// Fade in while rising dy px. Returns the progress.
export function show(el, t, t0, d = 0.5, dy = 24, e = ease.out) {
  const p = prog(t, t0, d, e);
  el.style.opacity = p;
  el.style.transform = p >= 1 ? "" : `translate3d(0, ${(1 - p) * dy}px, 0)`;
  return p;
}

// Scene exit over the last d seconds. Returns 0..1 (1 = gone).
export function outro(el, t, dur, d = 0.3) {
  const q = prog(t, dur - d, d, ease.in);
  el.style.opacity = 1 - q;
  el.style.transform = q > 0 ? `translate3d(0, ${-q * 26}px, 0)` : "";
  return q;
}

export function typed(text, t, t0, cps) {
  if (t < t0) return "";
  return text.slice(0, Math.floor(clamp((t - t0) * cps, 0, text.length)));
}

export const blink = (t, hz = 1.2) => Math.floor(t * hz * 2) % 2 === 0;

// Smooth 0..1 pulse used for status lamps (the site's 1.4s pulse).
export const pulse = (t, period = 1.4) => 0.5 + 0.5 * Math.cos((t / period) * Math.PI * 2);

export const fmtNum = (n) => n.toLocaleString("en-US");

// Clock string HH:MM:SS.cc from seconds since midnight.
export function clock(sec) {
  const s = Math.max(0, sec);
  const hh = Math.floor(s / 3600) % 24;
  const mm = Math.floor(s / 60) % 60;
  const ss = Math.floor(s) % 60;
  const cc = Math.floor((s % 1) * 100);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(hh)}:${p(mm)}:${p(ss)}.${p(cc)}`;
}

// Inline icons (the brand fonts' latin subsets have no arrow or check glyphs).
export const ICON = {
  arrow:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  check:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"><path d="M4.5 12.5l5 5 10-11"/></svg>',
  cross:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  link:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="9" height="8"/><rect x="12" y="8" width="9" height="8"/></svg>',
  person:
    '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
};

export const LOGO_SRC = "../../../assets/brand/logo-512.png";
