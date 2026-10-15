// Zelios-style scene templates for the Month Twelve videos.
//
// Every template: build({ dur, opts }) -> { el, update(t), cues() }.
// Common opts: bg ("aurora" | "light" | "photo:<file>"), tone ("dark" |
// "light"), blur and grid (for photo backgrounds), seed (varies the aurora),
// first (set on a video's opening scene: entry animations already complete
// on frame 0), voAt (from the voice-first plan: when each say phrase starts,
// so the animation lands with the words). Times are seconds into the scene.

import { h, clamp, LOGO_SRC } from "../../lib.js";
import { E, tw, shiftOf, blurIn, blurOut, richLine, scheduleLine, revealItem, buildBg, cursor, ICON } from "./common.js";

const toneOf = (opts) => opts.tone || (opts.bg === "light" ? "light" : "dark");
function sceneRoot(opts, cls) {
  const tone = toneOf(opts);
  const el = h("div", `scene zs ${cls}${tone === "light" ? " light" : ""}`);
  const bg = buildBg(el, opts.bg || "aurora", { tone, blur: opts.blur || 0, grid: !!opts.grid, seed: opts.seed || 1 });
  return { el, bg, tone };
}
// Start time for phrase k, or a fallback.
const vo = (opts, k, fallback) => (opts.voAt && opts.voAt.length > k ? Math.max(0.05, opts.voAt[k] - 0.05) : fallback);

// Lines that blur in letter by letter. Each line starts with its say phrase
// when there is one phrase per line; otherwise lines follow each other.
function textBlock(parent, lines, opts, startAt = 0.1) {
  const rows = lines.map((r) => (typeof r === "string" ? { text: r } : r));
  const L = rows.map((r) => richLine(parent, r.text, "zl" + (r.dim ? " dim" : "")));
  const perLine = opts.voAt && opts.voAt.length === rows.length;
  let t = vo(opts, 0, startAt);
  const at = L.map((l, k) => {
    if (perLine) t = Math.max(t, vo(opts, k, t));
    const s = scheduleLine(l.items, t);
    t = s[s.length - 1] + 0.18;
    return s;
  });
  return {
    update(te) { L.forEach((l, k) => l.items.forEach((it, i) => revealItem(it, te, at[k][i]))); },
    end: t,
    starts: at.map((a) => a[0]),
  };
}

// ---------------------------------------------------------------- text
const zt = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, `zt sz-${opts.size || "l"}`);
    const box = h("div", "zt-box" + (opts.align === "left" ? "" : " center"));
    el.append(box);
    const eb = opts.eyebrow ? h("div", "zeyebrow", opts.eyebrow) : null;
    if (eb) box.append(eb);
    const tb = textBlock(box, opts.lines, opts, eb ? 0.3 : 0.1);
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        if (eb) blurIn(eb, te, 0.02, { dy: 10 });
        tb.update(te);
        // A gentle float so held text keeps living.
        box.style.transform = `translateY(calc(-50% + ${(-6 * Math.sin(t * 0.8)).toFixed(2)}px))`;
      },
      cues: () => (opts.first ? [] : tb.starts.map((s) => ({ t: s, type: "phrase" }))),
    };
  },
};

// ---------------------------------------------------------------- chart
// The Slide: a typical vendor's service sags over twelve months, QUAICU's
// line stays flat and glowing. Two say phrases: the sag, then the flat line.
const zchart = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, "zchart");
    const card = h("div", "card zglass");
    card.innerHTML = `<div class="head"><span class="t">${opts.title || "Service quality, month 1 to 12"}</span><span class="pill">Illustrative</span></div>`;
    el.append(card);
    const SW = 848, SH = 540, X0 = 10, X1 = SW - 10, Y0 = 30, Y1 = SH - 70;
    const x = (m) => X0 + ((m - 1) / 11) * (X1 - X0);
    const y = (q) => Y1 - q * (Y1 - Y0);
    const g = (m, c, w) => Math.exp(-((m - c) ** 2) / (2 * w * w));
    const vendF = (m) => 0.9 - 0.5 * (1 - Math.exp(-(m - 1) / 4)) - 0.05 * g(m, 4, 0.5) - 0.06 * g(m, 7, 0.55) - 0.05 * g(m, 10, 0.5);
    const oursF = (m) => 0.86 + 0.035 * ((m - 1) / 11);
    const path = (f) => { let d = ""; for (let m = 1; m <= 12.0001; m += 0.1) d += `${d ? "L" : "M"}${x(m).toFixed(1)},${y(f(m)).toFixed(1)}`; return d; };
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", SW); svg.setAttribute("height", SH); svg.setAttribute("viewBox", `0 0 ${SW} ${SH}`);
    svg.innerHTML = `
      <defs>
        <linearGradient id="zgline" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c4f7dd"/><stop offset=".5" stop-color="#3fe29a"/><stop offset="1" stop-color="#1fc8b5"/></linearGradient>
        <linearGradient id="zgarea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fe29a" stop-opacity=".32"/><stop offset="1" stop-color="#3fe29a" stop-opacity="0"/></linearGradient>
        <clipPath id="zgclip"><rect class="cr" x="0" y="0" width="0" height="${SH}"/></clipPath>
      </defs>
      ${[0.25, 0.5, 0.75].map((k) => `<line class="gl" x1="${X0}" x2="${X1}" y1="${y(k)}" y2="${y(k)}"/>`).join("")}
      <line class="axis" x1="${X0}" x2="${X1}" y1="${Y1}" y2="${Y1}"/>
      <text class="ml" x="${X0}" y="${Y1 + 48}">MONTH 1</text><text class="ml" x="${X1}" y="${Y1 + 48}" text-anchor="end">MONTH 12</text>
      <path class="vend" d="${path(vendF)}"/>
      <circle class="head-dot" r="9"/>
      <text class="lbl v" x="${X1}" y="${y(vendF(12)) + 56}" text-anchor="end">Typical vendor</text>
      <path class="area" clip-path="url(#zgclip)" d="${path(oursF)} L${X1},${Y1} L${X0},${Y1} Z"/>
      <path class="ours" d="${path(oursF)}"/>
      <text class="lbl o" x="${X1}" y="${y(oursF(12)) - 32}" text-anchor="end">QUAICU</text>`;
    card.append(svg);
    const vend = svg.querySelector(".vend"), ours = svg.querySelector(".ours"), dot = svg.querySelector(".head-dot");
    const lblV = svg.querySelector(".lbl.v"), lblO = svg.querySelector(".lbl.o"), area = svg.querySelector(".area"), cr = svg.querySelector(".cr");
    // Callouts are glass pills in card coordinates, dropped on the line.
    const calls = (opts.callouts || []).map((c) => {
      const e = h("div", "callout zglass", `<span class="dot"></span>${c.text}`);
      card.append(e);
      return { e, m: c.m };
    });
    const capText = opts.caption ? h("div", "caption") : null;
    let cap = null;
    if (capText) { el.append(capText); cap = textBlock(capText, [opts.caption], {}, 0); }

    const T = { grey: 0.35 };
    T.green = vo(opts, 1, dur * 0.5);
    T.greyD = Math.max(1.2, Math.min(3.8, T.green - T.grey - 0.35));
    T.greenD = 1.3;
    T.cap = T.green + 0.9;
    let lv = null, lo = null, pos = null;
    return {
      el,
      update(t) {
        bg.update(t);
        blurIn(card, t, 0, { dy: 40, s0: 0.96 });
        if (!lv) { lv = vend.getTotalLength(); lo = ours.getTotalLength(); pos = calls.map((c) => [x(c.m), y(vendF(c.m))]); }
        const pv = tw(t, T.grey, T.greyD, E.io);
        vend.style.strokeDasharray = lv; vend.style.strokeDashoffset = lv * (1 - pv);
        const pt = vend.getPointAtLength(lv * pv);
        dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
        dot.style.opacity = pv > 0 && pv < 1 ? 1 : 0;
        lblV.style.opacity = tw(t, T.grey + T.greyD - 0.3, 0.5);
        const mNow = 1 + 11 * pv;
        calls.forEach((c, i) => {
          const at = T.grey + T.greyD * ((c.m - 1) / 11);
          const [cx, cy] = pos[i];
          c.e.style.left = `${46 + cx}px`; c.e.style.top = `${110 + cy - 96}px`;
          c.e.style.marginLeft = `-${c.e.offsetWidth / 2}px`;
          const p = tw(t, at, 0.6);
          c.e.style.opacity = clamp(p * 1.4) * (1 - 0.35 * tw(t, T.green, 0.6));
          c.e.style.filter = p >= 1 ? "" : `blur(${((1 - p) * 10).toFixed(1)}px)`;
          c.e.style.transform = `translateY(${((1 - p) * 20).toFixed(1)}px) scale(${(0.85 + 0.15 * p).toFixed(3)})`;
        });
        const po = tw(t, T.green, T.greenD, E.io);
        ours.style.strokeDasharray = lo; ours.style.strokeDashoffset = lo * (1 - po);
        cr.setAttribute("width", (X0 + (X1 - X0) * po).toFixed(1));
        lblO.style.opacity = tw(t, T.green + T.greenD - 0.3, 0.5);
        vend.style.opacity = 1 - 0.45 * tw(t, T.green, 0.8);
        if (cap) cap.update(t - T.cap);
      },
      cues: () => [
        { t: T.grey, type: "swell" },
        ...calls.map((c) => ({ t: T.grey + T.greyD * ((c.m - 1) / 11), type: "tick" })),
        { t: T.green, type: "swell" },
        { t: T.green + T.greenD, type: "chime" },
      ],
    };
  },
};

// ---------------------------------------------------------------- carousel
// Cards on a track with curly braces framing the active one (the Zelios
// "{ selected }" move). One say phrase per card; each card slides into the
// braces as its phrase starts.
const zcar = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, "zcar");
    const label = opts.label ? h("div", "label", opts.label) : null;
    if (label) el.append(label);
    const wrap = h("div", "");
    wrap.style.cssText = "position:absolute;inset:0";
    const track = h("div", "track");
    wrap.append(track);
    el.append(wrap);
    const STEP = 660, X = 240;
    const cards = opts.items.map((it, i) => {
      const c = h("div", "card", `<div class="num">${String(i + 1).padStart(2, "0")} / ${String(opts.items.length).padStart(2, "0")}</div><div class="ic">${ICON[it.icon] || ICON.sparkle}</div><div class="tt">${it.text}</div>`);
      c.style.left = `${i * STEP}px`;
      track.append(c);
      return c;
    });
    const BR = (flip) => `<svg viewBox="0 0 90 640" width="90" height="640" style="transform:scaleX(${flip ? -1 : 1})"><path d="M84 4C46 4 40 30 40 70V262C40 296 28 314 4 320C28 326 40 344 40 378V570C40 610 46 636 84 636" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg>`;
    const bl = h("div", "brace", BR(false)), br = h("div", "brace", BR(true));
    el.append(bl, br);
    const dots = h("div", "count", opts.items.map(() => "<i></i>").join(""));
    el.append(dots);
    const dotEls = [...dots.children];
    const at = opts.items.map((_, i) => vo(opts, i, 0.3 + i * Math.max(0.6, (dur - 1) / opts.items.length)));
    const shift = shiftOf(opts);
    let bw = null;
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        if (label) blurIn(label, te, 0, { dy: 10 });
        // Track position: eased move to each card as its phrase starts.
        let pos = 0;
        at.forEach((a, i) => { if (i > 0) pos += tw(t, a - 0.12, 0.7, E.expo); });
        const tx = X - pos * STEP;
        track.style.transform = `translate3d(${tx.toFixed(1)}px, 0, 0)`;
        blurIn(wrap, te, 0.05, { dy: 60, s0: 0.95 });
        cards.forEach((c, i) => {
          const d = Math.abs(i - pos);
          c.style.opacity = (1 - 0.6 * clamp(d)).toFixed(3);
          c.style.transform = `scale(${(1 - 0.1 * clamp(d)).toFixed(4)})`;
          c.style.filter = d > 0.05 ? `blur(${(clamp(d) * 3).toFixed(2)}px)` : "";
        });
        // Braces squeeze in as a card arrives, then open around it.
        if (bw === null) bw = 90;
        let pulse = 0;
        at.forEach((a, i) => { if (i > 0) { const k = t - (a - 0.12); if (k > 0 && k < 0.7) pulse = Math.max(pulse, Math.sin((k / 0.7) * Math.PI)); } });
        const gap = 18 - pulse * 40;
        bl.style.left = `${X - bw - gap}px`; br.style.left = `${X + 600 + gap}px`;
        const pb = tw(te, 0.25, 0.8);
        for (const b of [bl, br]) {
          b.style.opacity = clamp(pb * 1.3);
          b.style.filter = pb >= 1 ? "" : `blur(${((1 - pb) * 14).toFixed(1)}px)`;
          b.style.transform = `scaleY(${(1 - 0.06 * pulse).toFixed(3)})`;
        }
        const cur = Math.round(pos);
        dotEls.forEach((d, i) => d.classList.toggle("on", i === cur));
        blurIn(dots, te, 0.4, { dy: 10 });
      },
      cues: () => at.map((a, i) => ({ t: Math.max(0, a - 0.12), type: i ? "pass" : "phrase" })),
    };
  },
};

// ---------------------------------------------------------------- settings stack with toggles
// A settings panel: each row's toggle flips to "yours" as its phrase
// starts, clicked by a cursor.
const zstack = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, "zstack");
    const panel = h("div", "panel zglass white");
    panel.innerHTML = `<div class="ttl">${opts.eyebrow ? `<small>${opts.eyebrow}</small>` : ""}${opts.title}</div>`;
    el.append(panel);
    const rows = opts.items.map((it) => {
      const r = h("div", "row", `<div class="ic">${ICON[it.icon] || ICON.check}</div><div class="tx">${it.text}<small>${opts.before || "In the vendor’s name"}</small></div><div class="tg"><b></b></div>`);
      panel.append(r);
      return { r, tg: r.querySelector(".tg"), knob: r.querySelector(".tg b"), sub: r.querySelector("small") };
    });
    const cur = cursor(el);
    const at = rows.map((_, i) => vo(opts, i, 0.6 + i * Math.max(0.7, (dur - 1.2) / rows.length)));
    const click = at.map((a) => a + 0.35);
    const shift = shiftOf(opts);
    let path = null;
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(panel, te, 0, { dy: 50, s0: 0.96 });
        rows.forEach((o, i) => {
          blurIn(o.r, te, 0.15 + i * 0.08, { dy: 20 });
          const p = tw(t, click[i], 0.35, E.quint);
          o.knob.style.transform = `translateX(${(p * 48).toFixed(1)}px)`;
          o.tg.style.background = p > 0.5 ? "linear-gradient(90deg, #2bd47f, #0a9a57)" : "#d9e4de";
          o.sub.textContent = p > 0.5 ? (opts.after || "In your name") : (opts.before || "In the vendor’s name");
          o.sub.style.color = p > 0.5 ? "#0a9a57" : "#9a6a5a";
        });
        if (!path) {
          path = [];
          rows.forEach((o, i) => {
            const xx = panel.offsetLeft + o.tg.offsetLeft + o.tg.offsetWidth * 0.55;
            const yy = panel.offsetTop + o.tg.offsetTop + o.tg.offsetHeight * 0.6;
            path.push({ t: at[i] - 0.05, x: xx + (i ? 0 : 140), y: yy + (i ? -60 : 160) });
            path.push({ t: click[i], x: xx, y: yy, click: true });
          });
        }
        cur.update(t, path);
      },
      cues: () => click.map((c) => ({ t: c, type: "approve" })),
    };
  },
};

// ---------------------------------------------------------------- chat quote
const zquote = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, "zquote");
    const card = h("div", "card zglass");
    card.innerHTML = `<div class="who"><div class="av">${opts.initial || "B"}</div><div class="nm">${opts.name || "A buyer"}<small>${opts.source || "From a buyer review"}</small></div></div><div class="bubble"></div>`;
    el.append(card);
    const bubble = card.querySelector(".bubble");
    const text = opts.quote;
    const shift = shiftOf(opts);
    const T = { dots: 0.3, type: 0.75 };
    const typeD = clamp(dur * 0.45, 1.2, 2.2);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(card, te, 0, { dy: 60, s0: 0.95 });
        if (te < T.type) {
          const k = Math.floor(te * 6) % 3;
          bubble.innerHTML = `<span class="typing">${[0, 1, 2].map((i) => `<i style="opacity:${i === k ? 1 : 0.35}"></i>`).join("")}</span>`;
        } else {
          const n = Math.floor(clamp((te - T.type) / typeD) * text.length);
          const done = n >= text.length;
          bubble.innerHTML = `“${text.slice(0, n)}${done ? "”" : ""}<span class="caret" style="opacity:${done ? (Math.floor(t * 2) % 2 ? 0 : 1) : 1}"></span>`;
        }
      },
      cues: () => (opts.first ? [] : [{ t: T.type, type: "typing", n: text.length, cps: text.length / typeD }]),
    };
  },
};

// ---------------------------------------------------------------- myth / reality
const zmyth = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, "zmyth");
    const card = h("div", "card zglass white");
    card.innerHTML = `<div class="tag m">✕ Myth</div><div class="tag r">✓ Reality</div><div class="txt m"><span class="strike">${opts.myth}</span></div><div class="txt r"></div>`;
    el.append(card);
    const tagM = card.querySelector(".tag.m"), tagR = card.querySelector(".tag.r");
    const txtM = card.querySelector(".txt.m"), txtR = card.querySelector(".txt.r"), strike = card.querySelector(".strike");
    const real = textBlock(txtR, [opts.reality], {}, 0);
    const shift = shiftOf(opts);
    const T = { strike: Math.max(0.6, vo(opts, 1, dur * 0.45) - 0.55), real: vo(opts, 1, dur * 0.45) };
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(card, te, 0, { dy: 60, s0: 0.95 });
        blurIn(tagM, te, 0.1, { dy: 10 });
        strike.style.backgroundSize = `${(tw(t, T.strike, 0.45, E.io) * 100).toFixed(1)}% 7px`;
        if (t >= T.real - 0.1) { blurOut(txtM, t, T.real - 0.1, { d: 0.4 }); blurOut(tagM, t, T.real - 0.1, { d: 0.35 }); }
        else { txtM.style.opacity = 1; txtM.style.filter = ""; txtM.style.transform = ""; }
        blurIn(tagR, t, T.real, { dy: 10 });
        real.update(t - T.real - 0.05);
        card.style.boxShadow = t >= T.real ? `0 40px 90px rgba(10,60,35,.18), 0 0 0 ${(3 * tw(t, T.real, 0.5)).toFixed(2)}px rgba(43,212,127,.55)` : "";
      },
      cues: () => [{ t: T.strike, type: "block" }, { t: T.real, type: "approve" }],
    };
  },
};

// ---------------------------------------------------------------- month 1 vs month 6
const zvs = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, "zvs");
    const AV = [["A", "linear-gradient(140deg,#2bd47f,#0a9a57)"], ["R", "linear-gradient(140deg,#19c3b1,#0b6f8a)"], ["S", "linear-gradient(140deg,#a8f2cb,#2bb673)"]];
    const c1 = h("div", "col c1 zglass", `<div class="avs">${AV.map(([l, g]) => `<div class="av" style="background:${g}">${l}</div>`).join("")}</div><div><div class="when">${opts.a.when}</div><div class="what">${opts.a.what}</div></div>`);
    const c2 = h("div", "col c2 zglass", `<div class="avs"><div class="av q">?</div><div class="av" style="background:linear-gradient(140deg,#7d8b84,#4b5852)">J</div><div class="av q">?</div></div><div><div class="when">${opts.b.when}</div><div class="what">${opts.b.what}</div></div>`);
    const link = h("div", "link");
    el.append(c1, link, c2);
    const shift = shiftOf(opts);
    const A = vo(opts, 0, 0.1), B = vo(opts, 1, dur * 0.5);
    const av1 = [...c1.querySelectorAll(".av")], av2 = [...c2.querySelectorAll(".av")];
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        const p1 = blurIn(c1, te, A, { dx: -80, dy: 0 });
        av1.forEach((a, i) => blurIn(a, te, A + 0.15 + i * 0.08, { dy: 20, s0: 0.6 }));
        link.style.transform = `scaleY(${tw(t, B - 0.3, 0.5).toFixed(3)})`;
        blurIn(c2, t, B, { dx: 80, dy: 0 });
        av2.forEach((a, i) => blurIn(a, t, B + 0.15 + i * 0.08, { dy: 20, s0: 0.6 }));
        c1.style.opacity = (clamp(p1 * 1.3) * (1 - 0.45 * tw(t, B + 0.3, 0.6))).toFixed(3);
      },
      cues: () => [{ t: A, type: "phrase" }, { t: B, type: "block" }],
    };
  },
};

// ---------------------------------------------------------------- console in a laptop
// The QUAICU delivery console: starts full-frame on the engineer card and
// pulls back into a laptop (the Zelios UI-to-device move). Two say phrases:
// the engineer, then the AI agent. Captions carry the words for muted
// viewers.
const zcon = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, "zcon");
    const rig = h("div", "rig");
    rig.innerHTML = `
      <div class="screen"><div class="app">
        <div class="side">
          <div class="brandrow"><img src="${LOGO_SRC}" alt="">QUAICU</div>
          <div class="tk on"><b>TCK-2041</b>Checkout times out under load</div>
          <div class="tk"><b>TCK-2040</b>Export orders to CSV</div>
          <div class="tk"><b>TCK-2039</b>Update the pricing page</div>
          <div class="tk"><b>TCK-2038</b>Fix login redirect</div>
        </div>
        <div class="main">
          <div class="h"><small>TCK-2041 · MINOR</small>Checkout times out under load</div>
          <div class="eng"><div class="av">${ICON.user}</div><div class="nm">Your engineer<small>Forward deployed · with you since week 1</small></div><div class="badge">Assigned</div></div>
          <div class="ev e1"><div class="k ai">${ICON.sparkle}</div><div><span class="who">AI agent</span> drafted a fix<div class="bar"><b></b></div></div><span class="tm">10:02</span></div>
          <div class="ev e2"><div class="k ai">${ICON.shield}</div><div><span class="who">AI agent</span> ran every check <span class="ok">✓</span></div><span class="tm">10:05</span></div>
          <div class="ev e3"><div class="k p">${ICON.check}</div><div><span class="who">Your engineer</span> approved <span class="ok">✓</span></div><span class="tm">10:40</span></div>
        </div>
      </div></div>
      <div class="base"></div>`;
    el.append(rig);
    const eng = rig.querySelector(".eng"), e1 = rig.querySelector(".e1"), e2 = rig.querySelector(".e2"), e3 = rig.querySelector(".e3"), bar = rig.querySelector(".bar b");
    const capBox = h("div", "zt-box center");
    capBox.style.top = "1080px";
    el.append(capBox);
    const capEl = h("div", "capbar");
    capBox.append(capEl);
    const caps = (opts.captions || []).map((c) => richLine(capEl, c, "zl"));
    const A = vo(opts, 0, 0.2), B = vo(opts, 1, dur * 0.5);
    const capAt = caps.map((c, k) => scheduleLine(c.items, k === 0 ? A + 0.1 : B + 0.05));
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        // Pull back from the engineer card to the whole laptop, then drift.
        const pb = tw(te, 0, 1.7, E.io);
        const s = 1.8 - 0.72 * pb + 0.012 * t;
        // Offset of the engineer card from the rig's transform origin.
        const ox = 160, oy = -178;
        rig.style.transform = `translate3d(${(-ox * s * (1 - pb)).toFixed(1)}px, ${(-oy * s * (1 - pb) - 70).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
        eng.style.boxShadow = te >= A ? `0 0 0 ${(2 * tw(te, A, 0.4)).toFixed(2)}px rgba(43,212,127,.8)` : "";
        blurIn(e1, t, B - 0.05, { dy: 14 });
        bar.style.transform = `scaleX(${tw(t, B, 1.1, E.io).toFixed(3)})`;
        blurIn(e2, t, B + 0.6, { dy: 14 });
        blurIn(e3, t, B + 1.2, { dy: 14 });
        blurIn(capEl, te, A, { dy: 20, s0: 0.94 });
        caps.forEach((c, k) => {
          // Swap lines as the second line starts revealing, so the bar is never empty.
          c.line.style.display = k === (caps.length > 1 && t >= capAt[1][0] + 0.12 ? 1 : 0) ? "" : "none";
          c.items.forEach((it, i) => revealItem(it, k === 0 ? te : t, capAt[k][i]));
        });
      },
      cues: () => [{ t: A, type: "pass" }, { t: B, type: "phrase" }, { t: B + 0.6, type: "tick" }, { t: B + 1.2, type: "approve" }],
    };
  },
};

// ---------------------------------------------------------------- one engineer, week 1 to month 12
const zteam = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot(opts, "zteam");
    const card = h("div", "card zglass");
    const ticks = [1, 3, 6, 9, 12];
    card.innerHTML = `
      <div class="prof"><div class="av">${ICON.user}</div><div class="nm"><small>${opts.role || "Forward deployed engineer"}</small>${opts.name || "One engineer, start to finish"}</div></div>
      <div class="line"><div class="rail"><b></b></div>
        ${ticks.map((m) => `<div class="tick" style="left:${((m - 1) / 11) * 100}%"></div><div class="tl" style="left:${((m - 1) / 11) * 100}%">${m === 1 ? "WEEK 1" : "M" + m}</div>`).join("")}
        <div class="pin">${ICON.user}</div>
      </div>`;
    el.append(card);
    const agent = h("div", "agent zglass", `<div class="k">${ICON.sparkle}</div><div>${opts.agent || "Plus an AI agent on every ticket"}</div>`);
    el.append(agent);
    const rail = card.querySelector(".rail b"), pin = card.querySelector(".pin"), tEls = [...card.querySelectorAll(".tick")];
    const A = vo(opts, 0, 0.1), B = vo(opts, 1, dur * 0.45);
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(card, te, A, { dy: 50, s0: 0.96 });
        const p = tw(t, B, Math.max(1.2, dur - B - 0.8), E.io);
        rail.style.transform = `scaleX(${p.toFixed(4)})`;
        pin.style.left = `${(p * 100).toFixed(2)}%`;
        tEls.forEach((k, i) => k.classList.toggle("on", p >= (ticks[i] - 1) / 11 - 0.001));
        blurIn(agent, t, B + 0.5, { dy: 30 });
      },
      cues: () => [{ t: A, type: "phrase" }, { t: B, type: "swell" }, { t: B + 0.5, type: "pass" }],
    };
  },
};

// ---------------------------------------------------------------- logo end card
// A sparkle appears, morphs into the rounded square, the QUAICU mark lands,
// the wordmark slides out from behind it, then the line and the URL.
const zend = {
  build({ dur, opts }) {
    const { el, bg } = sceneRoot({ bg: opts.bg || "aurora", seed: opts.seed || 3 }, "zend");
    const spark = h("div", "spark", `<svg viewBox="0 0 100 100"><path d="M50 4C53 34 66 47 96 50 66 53 53 66 50 96 47 66 34 53 4 50 34 47 47 34 50 4Z" fill="currentColor"/></svg>`);
    const lock = h("div", "lock", `<div class="mk"><div class="sq"></div><img src="${LOGO_SRC}" alt=""></div><div class="wm"><span>QUAICU</span></div>`);
    el.append(spark, lock);
    const tagEl = h("div", "tag");
    el.append(tagEl);
    const tag = textBlock(tagEl, [opts.line || "Software service that *doesn’t fade.*"], {}, 0);
    const url = h("div", "url zglass", `<i></i>${opts.url || "quaicu.org"}`);
    el.append(url);
    const sq = lock.querySelector(".sq"), img = lock.querySelector("img"), wm = lock.querySelector(".wm"), wmIn = wm.firstChild, mk = lock.querySelector(".mk");
    let wmW = null;
    return {
      el,
      update(t) {
        bg.update(t);
        // Sparkle: appears spinning, then collapses into the square.
        const ps = tw(t, 0, 0.5, E.expo), pc = tw(t, 0.45, 0.35, E.io);
        spark.style.opacity = clamp(ps * 1.5) * (1 - pc);
        spark.style.transform = `rotate(${(-90 + 90 * ps + 45 * pc).toFixed(1)}deg) scale(${(0.2 + 0.8 * ps - 0.5 * pc).toFixed(3)})`;
        const pq = tw(t, 0.5, 0.6, E.expo);
        sq.style.opacity = clamp(pq * 2) * (1 - tw(t, 0.85, 0.3));
        sq.style.transform = `scale(${(0.3 + 0.7 * pq).toFixed(3)}) rotate(${((1 - pq) * 45).toFixed(1)}deg)`;
        img.style.opacity = tw(t, 0.8, 0.35);
        img.style.transform = `scale(${(0.9 + 0.1 * tw(t, 0.8, 0.5)).toFixed(3)})`;
        // Wordmark slides out from behind the mark.
        if (wmW === null) wmW = wmIn.offsetWidth;
        const pw = tw(t, 1.05, 0.8, E.expo);
        wm.style.width = `${(wmW * pw).toFixed(1)}px`;
        wmIn.style.transform = `translateX(${((1 - pw) * -60).toFixed(1)}px)`;
        wmIn.style.opacity = clamp(pw * 1.5);
        lock.style.gap = `${(28 * pw).toFixed(1)}px`;
        mk.style.transform = `scale(${(1 + 0.02 * Math.sin(t * 1.5)).toFixed(4)})`;
        tag.update(t - 1.45);
        blurIn(url, t, 2.0, { dy: 20 });
      },
      cues: () => [{ t: 0.0, type: "resolve" }, { t: 0.5, type: "impact" }, { t: 1.05, type: "swell" }, { t: 2.0, type: "cta" }],
    };
  },
};

export const Z_SCENES = { zt, zchart, zcar, zstack, zquote, zmyth, zvs, zcon, zteam, endcard: zend };
