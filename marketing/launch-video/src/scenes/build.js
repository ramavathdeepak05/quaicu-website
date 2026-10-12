// 4. Custom software: a business app (an order portal) assembles piece by
// piece and ships after review.

import { h, show, outro, prog, ease, clamp, lerp, backOut, voTimes, fmtNum, ICON } from "../lib.js";
import { COPY } from "../copy.js";
import { pillarText } from "./pillar.js";

const BARS = [0.42, 0.55, 0.48, 0.7, 0.62, 0.84, 0.95];

export default {
  build({ dur, opts, vo }) {
    const c = COPY.build;
    const short = !!opts.short;
    const el = h("div", "scene s-pillar s-build" + (short ? " short" : ""));
    const text = pillarText(el, c, { short });

    const win = h("div", "pwin app");
    win.innerHTML = `
      <div class="pw-top"><span class="dots"><i></i><i></i><i></i></span><span class="pw-title">${c.app}</span><span class="pw-url">portal.yourbusiness.com</span></div>
      <div class="ap-body">
        <aside class="ap-side">${c.nav.map((n, i) => `<div class="ap-nav${i === 1 ? " on" : ""}"><span class="sq"></span>${n}</div>`).join("")}</aside>
        <div class="ap-main">
          <div class="ap-kpis">${c.kpis.map(([l, v]) => `<div class="ap-kpi"><span class="l">${l}</span><span class="v">${v}</span></div>`).join("")}</div>
          <div class="ap-grid">
            <div class="ap-table">
              <div class="ap-tr th"><span>Order</span><span>Customer</span><span>Amount</span><span>Status</span></div>
              ${c.rows.map((r) => `<div class="ap-tr"><span>${r[0]}</span><span>${r[1]}</span><span>${r[2]}</span><span class="st st-${r[3].toLowerCase()}">${r[3]}</span></div>`).join("")}
            </div>
            <div class="ap-chart">${BARS.map(() => `<div class="bar"><i></i></div>`).join("")}</div>
          </div>
        </div>
      </div>
      <div class="pw-stamp">${ICON.check}<span>${c.stamp}</span></div>`;
    el.append(win);

    const navs = [...win.querySelectorAll(".ap-nav")];
    const kpis = [...win.querySelectorAll(".ap-kpi")];
    const kv0 = win.querySelector(".ap-kpi .v");
    const trs = [...win.querySelectorAll(".ap-tr:not(.th)")];
    const th = win.querySelector(".ap-tr.th");
    const bars = [...win.querySelectorAll(".ap-chart i")];
    const side = win.querySelector(".ap-side");
    const stamp = win.querySelector(".pw-stamp");
    const reviewChip = win.querySelector(".st-review");

    // Assembly timeline, compressed for short scenes.
    const sc = clamp((dur - 0.5) / 7, 0.22, 1);
    const T = {
      win: 0.08,
      side: 0.35 * sc,
      kpi: 0.8 * sc,
      rows: 1.4 * sc,
      bars: 2.1 * sc,
      stamp: 3.0 * sc,
      approve: 4.6 * sc,
    };
    const [, tChips] = voTimes(vo, 2, [0, Math.max(1.2, dur * 0.42)]);

    return {
      el,
      update(t) {
        text.update(t, tChips);
        const pw = prog(t, T.win, 0.5, ease.out);
        win.style.opacity = pw;
        win.style.transform = `translate3d(0, ${(1 - pw) * 40}px, 0) scale(${0.96 + 0.04 * pw})`;

        const ps = prog(t, T.side, 0.4, ease.out);
        side.style.transform = `translate3d(${(1 - ps) * -100}%, 0, 0)`;
        navs.forEach((n, i) => (n.style.opacity = prog(t, T.side + 0.1 + i * 0.05, 0.25)));

        kpis.forEach((k, i) => {
          const p = clamp((t - T.kpi - i * 0.12) / 0.35);
          k.style.opacity = clamp(p * 3);
          k.style.transform = `scale(${0.85 + 0.15 * backOut(p, 1.4)})`;
        });
        // Orders today keeps ticking up once the app is live.
        kv0.textContent = fmtNum(128 + Math.max(0, Math.floor((t - T.stamp) / 0.9)));

        th.style.opacity = prog(t, T.rows - 0.1, 0.3);
        trs.forEach((r, i) => {
          const p = prog(t, T.rows + i * 0.14, 0.35, ease.out);
          r.style.opacity = p;
          r.style.transform = p >= 1 ? "" : `translate3d(${(1 - p) * 40}px, 0, 0)`;
        });
        bars.forEach((b, i) => {
          const p = prog(t, T.bars + i * 0.06, 0.45, ease.out);
          b.style.transform = `scaleY(${p * BARS[i]})`;
        });

        const pst = clamp((t - T.stamp) / 0.4);
        stamp.style.opacity = clamp(pst * 3);
        stamp.style.transform = `scale(${t >= T.stamp ? lerp(1.35, 1, backOut(pst, 1.2)) : 1.35})`;

        // A reviewer approves the order that was waiting.
        if (reviewChip) {
          const on = t >= T.approve && !short;
          reviewChip.textContent = on ? "Approved" : "Review";
          reviewChip.className = "st " + (on ? "st-approved" : "st-review");
          reviewChip.parentElement.style.setProperty("--flash", on ? 1 - clamp((t - T.approve) / 0.7) : 0);
        }

        outro(el, t, dur, short ? 0.15 : 0.25);
      },
      cues: () => [
        ...kpis.map((_, i) => ({ t: T.kpi + i * 0.12, type: "blip" })),
        { t: T.stamp, type: "approve" },
        ...(short ? [] : [{ t: T.approve, type: "pass" }]),
      ],
    };
  },
};
