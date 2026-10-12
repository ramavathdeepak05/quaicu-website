// 6. AI workflows: an invoice arrives by email, AI reads it, a rule flags the
// amount, a finance lead approves, and it posts to SAP. Other examples
// (leads, support, reports, real estate, clinics) light up alongside.

import { h, show, outro, prog, ease, clamp, lerp, backOut, typed, voTimes, ICON } from "../lib.js";
import { COPY } from "../copy.js";
import { pillarText } from "./pillar.js";

export default {
  build({ fmt, dur, opts, vo }) {
    const c = COPY.automate;
    const short = !!opts.short;
    const el = h("div", "scene s-pillar s-automate" + (short ? " short" : ""));
    const text = pillarText(el, c, { short, chips: c.examples });

    const flow = h("div", "flow");
    const [email, read, rule, lead, sap] = c.steps;
    flow.innerHTML = `
      <div class="fs fs0"><span class="sk">${email.k}</span><span class="sv"><span class="file">PDF</span>${email.v}</span><span class="sd">${ICON.check}</span></div>
      <div class="fs fs1"><span class="sk">${read.k}</span><span class="sv fields">${read.fields.map(([k]) => `<span class="fld"><i>${k}</i><b></b></span>`).join("")}</span><span class="sd">${ICON.check}</span></div>
      <div class="fs fs2 warn"><span class="sk">${rule.k}</span><span class="sv">${rule.v}</span><span class="flag">Needs approval</span></div>
      <div class="fs fs3"><span class="sk">${lead.k}</span><span class="sv"><span class="btn">${ICON.check} ${lead.v}</span><span class="by">Approved by Finance lead</span></span><span class="sd">${ICON.check}</span></div>
      <div class="fs fs4"><span class="sk">${sap.k}</span><span class="sv">${sap.v} · Document 5100023</span><span class="sd">${ICON.check}</span></div>
      <div class="dot"></div>`;
    el.append(flow);

    const steps = [...flow.querySelectorAll(".fs")];
    const fields = [...flow.querySelectorAll(".fld b")];
    const flag = flow.querySelector(".flag");
    const btn = flow.querySelector(".btn");
    const by = flow.querySelector(".by");
    const dot = flow.querySelector(".dot");

    // Step times, compressed for short scenes.
    const sc = clamp((dur - 0.4) / 6.5, 0.15, 1);
    const S = [0.25, 0.85, 1.9, 2.8, 3.9].map((x) => x * sc + 0.05);
    const press = S[3] + 0.55 * sc;
    const segs = voTimes(vo, 3, [0, dur * 0.4, dur * 0.7]);
    const tChips = segs[1] ?? dur * 0.4;

    let geo = null;
    return {
      el,
      update(t) {
        if (!geo) geo = steps.map((s) => ({ y: s.offsetTop + s.offsetHeight / 2, x: s.offsetLeft + 30 }));
        text.update(t, tChips);
        show(flow, t, 0.05, 0.45, 30);

        steps.forEach((s, i) => {
          const p = prog(t, S[i], 0.3, ease.out);
          s.style.opacity = 0.28 + 0.72 * p;
          const active = t >= S[i] && (i === steps.length - 1 || t < S[i + 1]);
          s.style.setProperty("--act", active ? 1 : 0);
          s.style.setProperty("--done", i === 2 ? 0 : prog(t, (S[i + 1] ?? S[i] + 0.4) - 0.05, 0.2));
        });

        // AI reads the invoice fields.
        read.fields.forEach(([, val], i) => {
          const t0 = S[1] + 0.1 + i * 0.22 * sc;
          fields[i].textContent = typed(val, t, t0, 40 / sc);
        });
        const pf = clamp((t - S[2]) / 0.3);
        flag.style.opacity = clamp(pf * 3);
        flag.style.transform = `scale(${t >= S[2] ? lerp(1.3, 1, backOut(pf, 1.4)) : 1})`;

        // The finance lead presses Approve.
        const pp = clamp((t - press) / 0.25);
        btn.style.transform = `scale(${t >= press && pp < 1 ? 1 - 0.08 * Math.sin(pp * Math.PI) : 1})`;
        btn.style.setProperty("--on", t >= press ? 1 : 0);
        by.style.opacity = prog(t, press + 0.1, 0.3);

        // A dot runs down the connector to the active step.
        let y = geo[0].y;
        for (let i = 1; i < steps.length; i++) y = lerp(y, geo[i].y, prog(t, S[i] - 0.25, 0.25, ease.inOut));
        dot.style.transform = `translate3d(0, ${y - 6}px, 0)`;
        dot.style.opacity = prog(t, S[0], 0.2);

        // Highlight the examples one after another.
        if (!short) {
          text.chips.forEach((ch, i) => {
            const t0 = tChips + i * 0.22;
            ch.style.setProperty("--hot", t >= t0 ? 1 - clamp((t - t0 - 0.15) / 0.9) : 0);
          });
        }

        outro(el, t, dur, short ? 0.15 : 0.25);
      },
      cues: () => [
        ...S.map((t, i) => ({ t, type: i === 2 ? "flag" : "blip" })),
        { t: press, type: "approve" },
      ],
    };
  },
};
