// 2. Tension: everyone wants AI, but an AI agent on autopilot changes real
// business data with nobody signing off.

import { h, lines, rise, show, outro, prog, ease, clamp, blink, pulse, voTimes, ICON } from "../lib.js";
import { COPY } from "../copy.js";

export default {
  build({ dur, vo }) {
    const c = COPY.tension;
    const el = h("div", "scene s-tension");

    const text = h("div", "text");
    el.append(text);
    const a = lines(text, c.white, "display hl");
    const b = lines(text, c.grey.map((t) => ({ text: t, cls: "dim" })), "display hl hl2");

    const panel = h("div", "agent");
    panel.innerHTML = `
      <div class="ag-head"><span class="ag-name"><span class="lamp"></span>${c.agent}</span><span class="ag-run">RUNNING</span></div>
      <div class="ag-rows">
        ${c.actions.map((x) => `<div class="ag-row"><span class="ag-ok">${ICON.check}</span><span class="ag-txt">${x}</span><span class="ag-who">${c.approver} <b>${c.none}</b></span></div>`).join("")}
      </div>`;
    el.append(panel);
    const rows = [...panel.querySelectorAll(".ag-row")];
    const lamp = panel.querySelector(".lamp");

    const [tA, tB] = voTimes(vo, 2, [0.08, 1.4]);
    const rowT = rows.map((_, i) => 0.35 + i * Math.min(0.5, (dur - 1.2) / rows.length));

    return {
      el,
      update(t) {
        rise(a.inners, t, Math.max(0, tA - 0.05), { stagger: 0.08, d: 0.6 });
        rise(b.inners, t, Math.max(0, tB - 0.05), { stagger: 0.08, d: 0.6 });
        show(panel, t, 0.1, 0.5, 30);
        lamp.style.opacity = 0.3 + 0.7 * pulse(t, 0.6);
        rows.forEach((r, i) => {
          const p = prog(t, rowT[i], 0.3, ease.out);
          r.style.opacity = p;
          r.style.transform = p >= 1 ? "" : `translate3d(${(1 - p) * 30}px, 0, 0)`;
          const red = t >= tB ? (blink(t - tB, 1.2) ? 1 : 0.45) : 0.25;
          r.style.setProperty("--red", red);
        });
        outro(el, t, dur, 0.25);
      },
      cues: () => [...rowT.map((t) => ({ t, type: "blip" })), { t: tB, type: "alert" }],
    };
  },
};
