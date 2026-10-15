// Orbit: the client's forward deployed engineer at the centre (solid green),
// the AI agent circling them, and captions popping in below.
//
// opts: center (label), ring (agent label), captions [string]

import { h, clamp, ICON } from "../../lib.js";
import { entryShift, extras, pop, exit, spring, snap } from "./common.js";

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
    const t0 = 0.75;
    const gap = Math.max(0.5, snap(clamp((dur * 0.7 - t0) / Math.max(1, caps.length), 0.5, 1.5)));
    const capAt = caps.map((_, i) => (opts.voAt && opts.voAt.length === caps.length ? Math.max(0.3, opts.voAt[i]) : t0 + i * gap));

    let aw = null, ah = null;
    return {
      el,
      update(t) {
        const te = t + shift;
        const pc = spring(te, 0.0, 2.0, 0.45);
        core.style.transform = `scale(${0.3 + 0.7 * pc})`;
        core.style.opacity = clamp(te / 0.1);
        ring.style.opacity = clamp((te - 0.15) / 0.2);
        ring.style.transform = `rotate(${t * 14}deg) scale(${0.85 + 0.15 * spring(te, 0.15)})`;
        if (aw === null) { aw = agent.offsetWidth; ah = agent.offsetHeight; }
        // The agent swings in fast, then keeps circling.
        const a = -Math.PI * 0.85 + t * 1.1 + (1 - spring(te, 0.3, 1.6, 0.7)) * -1.2;
        agent.style.transform = `translate3d(${310 + Math.cos(a) * 310 - aw / 2}px, ${310 + Math.sin(a) * 310 - ah / 2}px, 0)`;
        agent.style.opacity = clamp((te - 0.3) / 0.12);
        capEls.forEach((e, i) => pop(e, te, capAt[i], { dy: 40 }));
        tick(t, te);
        exit(el, t, dur);
      },
      cues: () => [{ t: 0.05, type: "stamp" }, { t: 0.3, type: "shimmer" }, ...capEls.map((_, i) => ({ t: capAt[i], type: "pass" }))],
    };
  },
};
