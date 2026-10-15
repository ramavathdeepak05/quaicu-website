// Orbit: the client's forward deployed engineer at the centre, the AI agent
// circling them, and captions arriving below.
//
// opts: center (label), ring (agent label), captions [string]

import { h, show, outro, prog, ease, backOut, clamp, ICON } from "../../lib.js";
import { entryShift, extras } from "./common.js";

export default {
  build({ dur, opts }) {
    const caps = opts.captions || [];
    const el = h("div", `scene c c-orbit${caps.length === 1 ? " one" : ""}`);
    const shift = entryShift(opts);
    const tick = extras(el, opts);

    const wrap = h("div", "ring-wrap");
    wrap.innerHTML = `<div class="ring"></div><div class="core">${ICON.person}<div class="lb">${opts.center}</div></div><div class="agent"><span class="sq"></span>${opts.ring}</div>`;
    el.append(wrap);
    const ring = wrap.querySelector(".ring");
    const core = wrap.querySelector(".core");
    const agent = wrap.querySelector(".agent");

    const capBox = h("div", "caps");
    el.append(capBox);
    const capEls = caps.map((c) => {
      const e = h("div", "cap", (caps.length > 1 ? ICON.check : "") + `<span>${c}</span>`);
      capBox.append(e);
      return e;
    });
    const t0 = 1.0;
    const gap = clamp((dur * 0.75 - t0) / Math.max(1, caps.length), 0.5, 1.6);

    let aw = null, ah = null;
    return {
      el,
      update(t) {
        const te = t + shift;
        const pc = clamp((te - 0.05) / 0.6);
        core.style.opacity = clamp(pc * 2);
        core.style.transform = `scale(${0.8 + 0.2 * backOut(pc, 1.4)})`;
        ring.style.opacity = prog(te, 0.2, 0.6);
        ring.style.transform = `rotate(${t * 6}deg)`;
        if (aw === null) { aw = agent.offsetWidth; ah = agent.offsetHeight; }
        const a = -Math.PI / 2 + t * 0.55;
        const x = 300 + Math.cos(a) * 300 - aw / 2;
        const y = 300 + Math.sin(a) * 300 - ah / 2;
        agent.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        agent.style.opacity = prog(te, 0.45, 0.4);
        capEls.forEach((e, i) => show(e, te, t0 + i * gap, 0.45, 18));
        tick(t, te);
        outro(el, t, dur, 0.28);
      },
      cues: () => [{ t: 0.45, type: "shimmer" }, ...capEls.map((_, i) => ({ t: t0 + i * gap, type: "tick" }))],
    };
  },
};
