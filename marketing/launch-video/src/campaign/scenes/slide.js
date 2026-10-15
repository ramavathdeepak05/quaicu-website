// The Slide: the campaign's signature chart. Service quality over twelve
// months: a grey "typical vendor" line that starts high and sags, and a flat
// QUAICU line. Always tagged Illustrative: it is a concept, not data.
//
// opts:
//   variant   "decay" (default) | "speed" (a Speed line that peaks early,
//             against a flat Consistency line) | "reprise" (QUAICU line only,
//             with checks at month twelve)
//   callouts  [{ m, text }] labels dropped on the grey line as it passes month m
//   greenAt   seconds into the scene when the green line starts (default 45%)
//   caption   line under the chart once the green line is drawn
//   checks    [string] for the reprise
//   labels    { grey, green } line labels

import { h, prog, ease, clamp, ICON } from "../../lib.js";
import { entryShift, extras, pop, exit, spring } from "./common.js";

const NS = "http://www.w3.org/2000/svg";
const W = 900, X0 = 20, X1 = 880, Y0 = 30;

const svgEl = (tag, attrs = {}, text) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  return e;
};

const gauss = (m, c, w) => Math.exp(-((m - c) ** 2) / (2 * w * w));
const CURVES = {
  // Starts strong, sags with small dips where people change and dates slip.
  decay: (m) => 0.9 - 0.47 * (1 - Math.exp(-(m - 1) / 4.2)) - 0.05 * gauss(m, 4, 0.5) - 0.06 * gauss(m, 7, 0.55) - 0.05 * gauss(m, 10, 0.5),
  // Speed spikes in the first weeks, then falls away.
  speed: (m) => 0.32 + 0.62 * gauss(m, 2.1, 1.35),
  flat: (m) => 0.84 + 0.04 * ((m - 1) / 11),
};

export default {
  build({ dur, opts }) {
    const variant = opts.variant || "decay";
    const reprise = variant === "reprise";
    const H = reprise ? 470 : 640;
    const Y1 = H - 64;
    const x = (m) => X0 + ((m - 1) / 11) * (X1 - X0);
    const y = (q) => Y1 - q * (Y1 - Y0 - 20);
    const path = (f) => {
      let d = "";
      for (let m = 1; m <= 12.0001; m += 0.1) d += `${d ? "L" : "M"}${x(m).toFixed(1)},${y(f(m)).toFixed(1)}`;
      return d;
    };

    const el = h("div", `scene c c-slide${reprise ? " reprise" : ""}`);
    const shift = entryShift(opts);
    const tick = extras(el, { source: opts.source });
    const chart = h("div", "chart");
    chart.innerHTML = `<div class="ch-head"><span class="yl">${opts.yLabel || (variant === "speed" ? "Delivery over 12 months" : "Service quality")}</span><span class="c-tag">Illustrative</span></div>`;
    el.append(chart);
    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` });
    chart.append(svg);

    // Axes and month ticks.
    for (let k = 1; k <= 3; k++) {
      const gy = Y1 - (k / 4) * (Y1 - Y0);
      svg.append(svgEl("line", { class: "gl", x1: X0, y1: gy, x2: X1, y2: gy }));
    }
    svg.append(svgEl("line", { class: "ax", x1: X0, y1: Y1, x2: X1, y2: Y1 }));
    for (let m = 1; m <= 12; m++) svg.append(svgEl("line", { class: "tk", x1: x(m), y1: Y1, x2: x(m), y2: Y1 + 12 }));
    svg.append(svgEl("text", { class: "ml", x: X0, y: Y1 + 50 }, "MONTH 1"));
    svg.append(svgEl("text", { class: "ml", x: X1, y: Y1 + 50, "text-anchor": "end" }, "MONTH 12"));

    const greyF = variant === "speed" ? CURVES.speed : CURVES.decay;
    const greenF = CURVES.flat;
    const labels = {
      grey: variant === "speed" ? "Speed" : "Typical vendor",
      green: variant === "speed" ? "Consistency" : "QUAICU",
      ...(opts.labels || {}),
    };

    let grey = null, greyLbl = null;
    const calls = [];
    if (!reprise) {
      grey = svgEl("path", { class: "grey", d: path(greyF) });
      svg.append(grey);
      greyLbl = svgEl("text", { class: "lbl n", x: X1, y: y(greyF(12)) + 58, "text-anchor": "end" }, labels.grey);
      svg.append(greyLbl);
      for (const c of opts.callouts || []) {
        const g = svgEl("g");
        const cy = y(greyF(c.m));
        g.append(svgEl("rect", { class: "dot", x: x(c.m) - 11, y: cy - 11, width: 22, height: 22 }));
        const tw = c.text.length * 18 + 36;
        g.append(svgEl("rect", { class: "co-bg", x: x(c.m) - tw / 2, y: cy - 98, width: tw, height: 56 }));
        g.append(svgEl("text", { class: "co", x: x(c.m), y: cy - 59, "text-anchor": "middle" }, c.text));
        g.style.transformOrigin = `${x(c.m)}px ${cy}px`;
        svg.append(g);
        calls.push({ g, m: c.m });
      }
    }
    const ph = svgEl("line", { class: "ph", x1: X0, y1: Y0, x2: X0, y2: Y1 });
    const green = svgEl("path", { class: "green", d: path(greenF) });
    const gdot = svgEl("rect", { class: "gdot", width: 30, height: 30, x: x(1) - 15, y: y(greenF(1)) - 15 });
    const greenLbl = svgEl("text", { class: "lbl g", x: X1, y: y(greenF(12)) - 34, "text-anchor": "end" }, labels.green);
    svg.append(ph, green, gdot, greenLbl);

    const caption = opts.caption ? h("div", "c-caption", opts.caption) : null;
    if (caption) el.append(caption);
    let checks = [];
    if (reprise && opts.checks) {
      const box = h("div", "checks");
      checks = opts.checks.map((c) => {
        const e = h("div", "ck", ICON.check + `<span>${c}</span>`);
        box.append(e);
        return e;
      });
      el.append(box);
    }

    const T = {
      grey: 0.5,
      greyD: Math.min(3.6, dur * 0.3),
      // With two say phrases, the green line starts with the second one.
      green: opts.voAt && opts.voAt.length > 1 ? opts.voAt[1] : opts.greenAt != null ? opts.greenAt : reprise ? 0.5 : dur * 0.45,
      greenD: reprise ? 1.6 : 1.2,
    };
    // The grey line finishes falling just before the green line arrives.
    if (!reprise) T.greyD = Math.min(3.6, Math.max(1.2, T.green - T.grey - 0.3));
    T.cap = T.green + T.greenD + 0.2;
    T.checks = T.green + T.greenD * 0.6;
    const ckGap = checks.length ? clamp((dur - 1.2 - T.checks) / checks.length, 0.4, 1.2) : 0;

    let lens = null;
    return {
      el,
      update(t) {
        const te = t + shift;
        if (!lens) lens = { g: grey ? grey.getTotalLength() : 0, n: green.getTotalLength() };
        pop(chart, te, 0, { dy: 60, s0: 0.96 });

        if (grey) {
          const pg = prog(te, T.grey, T.greyD, ease.inOut);
          grey.style.strokeDasharray = lens.g;
          grey.style.strokeDashoffset = lens.g * (1 - pg);
          greyLbl.style.opacity = prog(te, T.grey + T.greyD - 0.2, 0.4);
          const mNow = 1 + 11 * pg;
          for (const c of calls) {
            const tc = T.grey + T.greyD * ((c.m - 1) / 11);
            c.g.style.opacity = te >= tc ? 1 : 0;
            c.g.style.transform = `scale(${0.6 + 0.4 * spring(te, tc, 3, 0.5)})`;
          }
          // Playhead follows the grey line while it draws.
          ph.setAttribute("x1", x(mNow)); ph.setAttribute("x2", x(mNow));
          ph.style.opacity = pg > 0 && pg < 1 ? 1 : 0;
        }
        const pn = prog(t, T.green, T.greenD, ease.inOut);
        green.style.strokeDasharray = lens.n;
        green.style.strokeDashoffset = lens.n * (1 - pn);
        const pt = green.getPointAtLength(lens.n * pn);
        gdot.setAttribute("x", pt.x - 15);
        gdot.setAttribute("y", pt.y - 15);
        gdot.style.opacity = t >= T.green ? 1 : 0;
        greenLbl.style.opacity = prog(t, T.green + T.greenD - 0.3, 0.4);
        if (grey && t >= T.green) grey.style.opacity = 1 - 0.45 * prog(t, T.green, 0.8);

        if (caption) pop(caption, t, T.cap, { dy: 50 });
        checks.forEach((e, i) => pop(e, t, T.checks + i * ckGap, { dx: 100, dy: 0, s0: 1 }));
        tick(t, te);
        exit(el, t, dur);
      },
      cues: () => [
        ...(grey && !opts.first ? [{ t: T.grey, type: "stream", dur: T.greyD }] : []),
        ...calls.map((c) => ({ t: T.grey + T.greyD * ((c.m - 1) / 11), type: "block" })),
        { t: T.green, type: "swell" },
        { t: T.green + T.greenD, type: "stamp" },
        ...(caption ? [{ t: T.cap, type: "phrase" }] : []),
        ...checks.map((_, i) => ({ t: T.checks + i * ckGap, type: "tick" })),
      ],
    };
  },
};
