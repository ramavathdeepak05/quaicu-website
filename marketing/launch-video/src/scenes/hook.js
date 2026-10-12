// 1. Hook: orders in Salesforce, invoices in SAP, and a person copying rows
// from one to the other by hand. The 60s cut lands three lines with the
// voiceover; the shorter cuts ask one question.

import { h, lines, rise, show, outro, prog, ease, clamp, lerp, slam, voTimes, ICON } from "../lib.js";
import { COPY } from "../copy.js";

const CURSOR =
  '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2l15 9-6.5 1.6L16 20l-3 1.4-3.4-7.3L4 18z" fill="#0a0a0a" stroke="#ffffff" stroke-width="1.4"/></svg>';

export default {
  build({ fmt, dur, opts, vo }) {
    const c = COPY.hook;
    const full = !!opts.full;
    const v = fmt === "9x16";
    const el = h("div", "scene s-hook" + (full ? " full" : " q"));

    let kin = [], hl = null;
    if (full) {
      const box = h("div", "kin display");
      kin = c.lines.map((t, i) => {
        const ln = h("div", "slam" + (i === 2 ? " dim" : ""), t);
        box.append(ln);
        return ln;
      });
      el.append(box);
    } else {
      const rows = v ? ["Still copying data", "between SAP", "and Salesforce?"] : c.question;
      hl = lines(el, rows.map((t, i) => (i ? { text: t, cls: "dim" } : t)), "display hl");
    }

    const apps = h("div", "apps");
    const card = (side, info) => `
      <div class="appcard ${side}">
        <div class="ac-head"><span class="ac-app">${info.app}</span><span class="ac-view">${info.view}</span></div>
        <div class="ac-rows"></div>
      </div>`;
    apps.innerHTML = `
      ${card("left", c.left)}
      <div class="lane"><div class="dash"></div><div class="count"><span class="cl">${c.counter}</span><b>31</b></div></div>
      ${card("right", c.right)}
      <div class="carry"><span class="chip"></span><span class="cur">${CURSOR}</span></div>`;
    el.append(apps);

    const [leftRows, rightRows] = [...apps.querySelectorAll(".ac-rows")];
    const rowHtml = (r) => `<span>${r[0]}</span><span>${r[1]}</span><span>${r[2]}</span>`;
    const L = c.rows.map((r) => {
      const d = h("div", "ac-row", rowHtml(r));
      leftRows.append(d);
      return d;
    });
    const R = c.rows.map((r) => {
      const d = h("div", "ac-row", rowHtml(r));
      rightRows.append(d);
      return d;
    });
    const carry = apps.querySelector(".carry");
    const chip = apps.querySelector(".chip");
    const count = apps.querySelector(".count b");
    const countBox = apps.querySelector(".count");

    // One row is carried across every `period` seconds.
    const period = full ? 0.7 : 0.5;
    const t0 = full ? 0.55 : 0.4;
    const n = Math.min(c.rows.length, Math.floor((dur - t0 - 0.4) / period));
    const kinT = voTimes(vo, 3, [0.08, 1.0, 1.92]);

    let geo = null;
    return {
      el,
      update(t) {
        if (!geo) {
          const a = apps.getBoundingClientRect();
          const pos = (e) => {
            const b = e.getBoundingClientRect();
            return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height };
          };
          geo = { L: L.map(pos), R: R.map(pos) };
        }
        if (full) kin.forEach((k, i) => slam(k, t, kinT[i]));
        else rise(hl.inners, t, 0.05, { stagger: 0.1, d: 0.7 });

        show(apps, t, full ? 0.15 : 0.1, 0.5, 30);

        let copied = 0;
        carry.style.opacity = 0;
        for (let i = 0; i < n; i++) {
          const s = t0 + i * period;
          const u = clamp((t - s) / (period * 0.8));
          L[i].style.setProperty("--sel", t >= s && t < s + period * 0.85 ? 1 : 0);
          const landed = t >= s + period * 0.8;
          R[i].style.opacity = landed ? 1 : 0;
          R[i].style.setProperty("--new", landed ? 1 - clamp((t - s - period * 0.8) / 0.5) : 0);
          if (landed) copied++;
          if (t >= s && u < 1) {
            const e = ease.inOut(u);
            const A = geo.L[i], B = geo.R[i];
            const x0 = A.x + A.w * 0.3, y0 = A.y + A.h / 2;
            const x1 = B.x + B.w * 0.3, y1 = B.y + B.h / 2;
            const lift = Math.sin(e * Math.PI) * (v ? 0 : -40);
            const sx = v ? Math.sin(e * Math.PI) * 60 : 0;
            carry.style.opacity = 1;
            carry.style.transform = `translate3d(${lerp(x0, x1, e) + sx}px, ${lerp(y0, y1, e) + lift}px, 0)`;
            chip.textContent = `${c.rows[i][0]} · ${c.rows[i][2]}`;
          }
        }
        for (let i = n; i < R.length; i++) R[i].style.opacity = 0;
        count.textContent = 31 + copied;
        countBox.style.setProperty("--hot", copied ? 1 - clamp((t - (t0 + (copied - 1) * period + period * 0.8)) / 0.5) : 0);

        outro(el, t, dur, 0.25);
      },
      cues: () => {
        const out = [];
        if (full) kinT.forEach((t) => out.push({ t, type: "slam" }));
        for (let i = 0; i < n; i++) {
          out.push({ t: t0 + i * period, type: "tick" });
          out.push({ t: t0 + i * period + period * 0.8, type: "paste" });
        }
        return out;
      },
    };
  },
};
