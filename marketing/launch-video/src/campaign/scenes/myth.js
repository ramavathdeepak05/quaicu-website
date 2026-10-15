// Myth / reality: the myth card is struck through in red, then a solid green
// reality card slams in under it. Without opts.reality the scene ends on the
// struck-through myth.
//
// opts: myth, reality, mythLabel, realityLabel

import { h, clamp, prog, ease } from "../../lib.js";
import { entryShift, pop, exit, snap } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-myth");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);

    const m = h("div", "blk myth");
    m.innerHTML = `<div class="lab m">${opts.mythLabel || "Myth"}</div><div class="txt"><span class="strike">${opts.myth}</span></div>`;
    box.append(m);
    const strike = m.querySelector(".strike");
    const mtxt = m.querySelector(".txt");
    let r = null;
    if (opts.reality) {
      r = h("div", "blk reality");
      r.innerHTML = `<div class="lab r">${opts.realityLabel || "Reality"}</div><div class="txt">${opts.reality}</div>`;
      box.append(r);
    }

    const T = r ? { strike: snap(Math.min(2.5, dur * 0.25)), real: snap(Math.min(2.5, dur * 0.25)) + 0.5 } : { strike: snap(dur * 0.45) };

    return {
      el,
      update(t) {
        const te = t + shift;
        pop(m, te, 0, { dy: 70, s0: 0.94 });
        const ps = prog(t, T.strike, 0.35, ease.inOut);
        strike.style.backgroundSize = `${ps * 100}% 10px`;
        mtxt.style.opacity = 1 - 0.5 * clamp((t - T.strike - 0.3) / 0.2);
        if (r) pop(r, t, T.real, { dy: 160, s0: 0.9, f: 2.2 });
        exit(el, t, dur);
      },
      cues: () => [
        { t: T.strike, type: "block" },
        ...(r ? [{ t: T.real, type: "stamp" }] : []),
      ],
    };
  },
};
