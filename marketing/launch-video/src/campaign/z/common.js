// Shared helpers for the Zelios-style scenes: easing, blur-in reveals,
// rich text (letter-by-letter, gradient words, inline cards), backgrounds
// (luminous aurora, light gradient, blurred photography) and icons.
//
// Motion rules from the Zelios reference: smooth expo/quint ease-outs, no
// bounce; text and UI arrive by un-blurring; something keeps moving at all
// times (drifting light, a camera push), but slowly.

import { h, clamp } from "../../lib.js";

export const E = {
  expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  quint: (x) => 1 - Math.pow(1 - x, 5),
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
};
export const tw = (t, t0, d, e = E.expo) => e(clamp((t - t0) / d));

// Seconds added to t for entry animations on a video's opening scene, so
// the hook is complete on frame 0.
export const shiftOf = (opts) => (opts.first ? 30 : 0);

// An element whose CSS centres it with a transform keeps that transform in
// data-tf, so the entrance composes with it instead of replacing it.
export function blurIn(el, t, at, { d = 0.75, blur = 16, dy = 26, dx = 0, s0 = 1, e = E.expo } = {}) {
  const p = tw(t, at, d, e);
  const base = el.dataset.tf || "";
  el.style.opacity = clamp(p * 1.3);
  el.style.filter = p >= 0.995 ? "" : `blur(${((1 - p) * blur).toFixed(2)}px)`;
  el.style.transform = p >= 0.995 ? base : `${base} translate3d(${((1 - p) * dx).toFixed(1)}px, ${((1 - p) * dy).toFixed(1)}px, 0) scale(${(s0 + (1 - s0) * p).toFixed(4)})`;
  return p;
}

export function blurOut(el, t, at, { d = 0.45, blur = 14, dy = -14 } = {}) {
  const q = tw(t, at, d, E.io);
  if (q <= 0) return 0;
  el.style.opacity = 1 - q;
  el.style.filter = `blur(${(q * blur).toFixed(2)}px)`;
  el.style.transform = `translate3d(0, ${(q * dy).toFixed(1)}px, 0)`;
  return q;
}

// ---------- rich text ----------
// Text markup: *gradient words*  and  [[icon|label]] for an inline glass
// card that opens up between the words (the Zelios "Beautifully [image]
// designed" move). Plain words reveal letter by letter; gradient words and
// inline cards reveal as a whole.
export function richLine(parent, text, cls = "zl") {
  const line = h("div", cls);
  const items = []; // { kind: "char" | "word" | "chip", el, inner? }
  const tokens = text.match(/\[\[[^\]]+\]\]|\*[^*]+\*|\S+/g) || [];
  tokens.forEach((tok, ti) => {
    if (tok.startsWith("[[")) {
      const [icon, label] = tok.slice(2, -2).split("|");
      const chip = h("span", "zchip", `<span class="zchip-in">${ICON[icon] || ""}${label ? `<span>${label}</span>` : ""}</span>`);
      line.append(chip);
      items.push({ kind: "chip", el: chip, inner: chip.firstChild });
    } else if (tok.startsWith("*")) {
      tok.slice(1, -1).split(" ").forEach((w, wi, arr) => {
        const s = h("span", "zw zgrad", w);
        line.append(s);
        items.push({ kind: "word", el: s });
        if (wi < arr.length - 1) line.append(document.createTextNode(" "));
      });
    } else {
      const word = h("span", "zw");
      for (const ch of tok) {
        const c = h("span", "zc", ch);
        word.append(c);
        items.push({ kind: "char", el: c });
      }
      line.append(word);
    }
    if (ti < tokens.length - 1) line.append(document.createTextNode(" "));
  });
  parent.append(line);
  return { line, items };
}

// Start times for a line's items: letters fast, gradient words and chips a
// touch slower so they read as the payoff.
export function scheduleLine(items, t0, { perChar = 0.018, perWord = 0.09 } = {}) {
  let t = t0;
  return items.map((it) => {
    const at = t;
    t += it.kind === "char" ? perChar : perWord;
    return at;
  });
}

export function revealItem(it, t, at) {
  if (it.kind === "chip") {
    // The card opens up between the words, pushing them apart.
    const p = tw(t, at, 0.8, E.expo);
    const w = it.inner.scrollWidth;
    it.el.style.width = `${(w * p).toFixed(1)}px`;
    it.el.style.marginInline = `${(0.12 * p).toFixed(3)}em`;
    it.inner.style.opacity = clamp(p * 1.5);
    it.inner.style.filter = p >= 0.99 ? "" : `blur(${((1 - p) * 10).toFixed(2)}px)`;
    it.inner.style.transform = `scale(${(0.6 + 0.4 * p).toFixed(3)})`;
    return;
  }
  const big = it.kind === "word";
  blurIn(it.el, t, at, { d: big ? 0.8 : 0.55, blur: big ? 18 : 12, dy: big ? 18 : 0, s0: big ? 0.92 : 1 });
  if (!big) it.el.style.transform = "";
}

// ---------- backgrounds ----------
// spec: "aurora" (luminous emerald and teal light on deep green-black),
// "light" (bright mint-white with soft green glow), or "photo:<file>"
// with tone "dark" | "light" and optional { blur, grid }.
export function buildBg(scene, spec = "aurora", { tone = "dark", blur = 0, grid = false, seed = 1 } = {}) {
  const el = h("div", "zbg");
  scene.prepend(el);
  if (spec.startsWith("photo:")) {
    const file = spec.slice(6);
    el.classList.add("photo", tone);
    el.innerHTML = `<img src="../../../uploads/stock-images/${file}" alt=""><div class="shade"></div>`;
    const img = el.querySelector("img");
    if (blur) img.style.filter = `blur(${blur}px)`;
    if (grid) el.append(gridLines());
    return { update: (t) => (img.style.transform = `scale(${(1.08 + 0.012 * t).toFixed(4)}) translate3d(${(-6 * Math.sin(t * 0.2)).toFixed(2)}px, 0, 0)`) };
  }
  if (spec === "light") {
    el.classList.add("light");
    el.innerHTML = `<div class="glow g1"></div><div class="glow g2"></div>`;
    if (grid) el.append(gridLines());
    const g1 = el.querySelector(".g1"), g2 = el.querySelector(".g2");
    return {
      update(t) {
        g1.style.transform = `translate3d(${(Math.sin(t * 0.35 + seed) * 60).toFixed(1)}px, ${(Math.cos(t * 0.3) * 30).toFixed(1)}px, 0)`;
        g2.style.transform = `translate3d(${(Math.cos(t * 0.28 + seed) * 70).toFixed(1)}px, ${(Math.sin(t * 0.25) * 40).toFixed(1)}px, 0)`;
      },
    };
  }
  // Aurora: big soft light blobs plus flowing silk ribbons, all drifting.
  el.classList.add("aurora");
  el.innerHTML = `
    <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div>
    <svg class="silk" viewBox="0 0 1080 1350" preserveAspectRatio="none">
      <defs>
        <linearGradient id="zs1-${seed}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ff0be"/><stop offset=".5" stop-color="#16b06a"/><stop offset="1" stop-color="#0c6f6a"/></linearGradient>
        <linearGradient id="zs2-${seed}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fd6c0"/><stop offset="1" stop-color="#0b4d3a"/></linearGradient>
      </defs>
      <path class="r1" stroke="url(#zs1-${seed})"/><path class="r2" stroke="url(#zs2-${seed})"/><path class="r3" stroke="url(#zs1-${seed})"/>
    </svg>`;
  if (grid) el.append(gridLines());
  const blobs = [...el.querySelectorAll(".blob")];
  const paths = [...el.querySelectorAll("path")];
  return {
    update(t) {
      const a = t * 0.32 + seed;
      blobs.forEach((b, i) => {
        const x = Math.sin(a * (0.7 + i * 0.13) + i * 1.7) * 120;
        const y = Math.cos(a * (0.6 + i * 0.11) + i) * 90;
        b.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
      paths.forEach((p, i) => {
        const k = a * (0.55 + i * 0.2) + i * 2.1;
        const y0 = 420 + i * 260 + Math.sin(k) * 90;
        const c1 = y0 - 260 + Math.cos(k * 1.3) * 160;
        const c2 = y0 + 240 + Math.sin(k * 0.9) * 180;
        const y1 = y0 + 120 + Math.cos(k * 0.7) * 120;
        p.setAttribute("d", `M -200 ${y0.toFixed(1)} C 260 ${c1.toFixed(1)}, 760 ${c2.toFixed(1)}, 1300 ${y1.toFixed(1)}`);
      });
    },
  };
}

function gridLines() {
  const g = h("div", "zgrid");
  g.innerHTML = `<i class="v" style="left:22%"></i><i class="v" style="left:78%"></i><i class="h" style="top:24%"></i><i class="h" style="top:76%"></i>`;
  return g;
}

// macOS-style pointer and a click ring, positioned in the scene's own pixels.
export function cursor(parent) {
  const c = h("div", "zcur", `<svg viewBox="0 0 24 24"><path d="M5 3l13.5 8.6-6.2 1.4 3.6 6.9-2.7 1.4-3.6-6.9L5 19z" fill="#fff" stroke="#0a0a0a" stroke-width="1.3" stroke-linejoin="round"/></svg>`);
  const ring = h("div", "zring");
  parent.append(ring, c);
  return {
    // path: [{ t, x, y, click? }] keyframes; eased between them.
    update(t, path) {
      if (!path.length) return;
      let i = 0;
      while (i < path.length - 1 && t >= path[i + 1].t) i++;
      const a = path[i], b = path[Math.min(i + 1, path.length - 1)];
      const p = b === a ? 1 : E.io(clamp((t - a.t) / Math.max(0.001, Math.min(0.7, b.t - a.t))));
      const x = a.x + (b.x - a.x) * p, y = a.y + (b.y - a.y) * p;
      const clk = path.filter((k) => k.click && t >= k.t).pop();
      const since = clk ? t - clk.t : 9;
      c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${since < 0.12 ? 0.85 : 1})`;
      c.style.opacity = clamp((t - path[0].t) / 0.2);
      if (clk && since < 0.5) {
        ring.style.opacity = 1 - since / 0.5;
        ring.style.transform = `translate3d(${clk.x}px, ${clk.y}px, 0) scale(${0.3 + since * 2})`;
      } else ring.style.opacity = 0;
    },
  };
}

// ---------- icons (24px stroke) ----------
const I = (d) => `<svg class="zi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICON = {
  check: I('<path d="M5 12.5l4.5 4.5L19 7"/>'),
  sparkle: I('<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/>'),
  user: I('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6"/>'),
  users: I('<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2"/><path d="M16 5.6a3 3 0 010 5.8M17.5 14.6c1.9.6 3.1 2.2 3.5 4.9"/>'),
  swap: I('<path d="M7 7h11l-3-3M17 17H6l3 3"/>'),
  video: I('<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3"/>'),
  clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  chat: I('<path d="M4 5.5h16v10H9l-5 4z"/>'),
  bug: I('<rect x="7" y="8" width="10" height="11" rx="5"/><path d="M12 8v11M4 12h3M17 12h3M5 18l2.5-1.5M19 18l-2.5-1.5M5 6.5L7.5 8M19 6.5L16.5 8M9.5 5.5l1 2M14.5 5.5l-1 2"/>'),
  receipt: I('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
  lock: I('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/>'),
  code: I('<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>'),
  globe: I('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5S14.6 18.1 12 20.5M12 3.5C9.4 5.9 8.1 8.7 8.1 12s1.3 6.1 3.9 8.5"/>'),
  cloud: I('<path d="M7.5 18.5h9.5a4 4 0 00.5-8 5.5 5.5 0 00-10.6-1.2A4.6 4.6 0 007.5 18.5z"/>'),
  grid: I('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
  arrow: I('<path d="M5 12h13M13 6l6 6-6 6"/>'),
  ticket: I('<path d="M4 7.5A1.5 1.5 0 015.5 6h13A1.5 1.5 0 0120 7.5V10a2 2 0 000 4v2.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 16.5V14a2 2 0 000-4z"/>'),
  shield: I('<path d="M12 3.5l7 3v5c0 4.6-3 7.8-7 9-4-1.2-7-4.4-7-9v-5z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.4"/>'),
  key: I('<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5"/>'),
  layers: I('<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>'),
  trend: I('<path d="M3.5 17l5.5-5.5 4 4 7.5-8"/><path d="M15 7.5h5.5V13"/>'),
  alert: I('<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.2v.3"/>'),
  gauge: I('<path d="M4.5 17a8 8 0 1115 0"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1.2"/>'),
  help: I('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 014.8.9c0 1.7-2.4 2.2-2.4 3.7M12 16.8v.3"/>'),
  doc: I('<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9 12h6M9 15.5h6"/>'),
  card: I('<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17M7 14.5h4"/>'),
  calendar: I('<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'),
};
