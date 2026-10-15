// Myth / reality: the myth is struck through, then the reality replaces it.
// Without opts.reality the scene ends on the struck-through myth.
//
// opts: myth, reality, mythLabel, realityLabel

import { h, show, outro, prog, ease } from "../../lib.js";
import { entryShift } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-myth");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);

    const m = h("div", "myth");
    m.innerHTML = `<div class="lab m">${opts.mythLabel || "Myth"}</div><div class="txt"><span class="strike">${opts.myth}</span></div>`;
    box.append(m);
    const strike = m.querySelector(".strike");
    const mtxt = m.querySelector(".txt");
    let r = null;
    if (opts.reality) {
      r = h("div", "reality");
      r.innerHTML = `<div class="lab r">${opts.realityLabel || "Reality"}</div><div class="txt">${opts.reality}</div>`;
      box.append(r);
    }

    const T = r ? { strike: dur * 0.3, real: dur * 0.3 + 0.7 } : { strike: dur * 0.55 };

    return {
      el,
      update(t) {
        const te = t + shift;
        show(m, te, 0.05, 0.5, 24);
        const ps = prog(t, T.strike, 0.6, ease.inOut);
        strike.style.backgroundSize = `${ps * 100}% 8px`;
        mtxt.style.opacity = 1 - 0.55 * prog(t, T.strike + 0.5, 0.5);
        if (r) show(r, t, T.real, 0.6, 30);
        outro(el, t, dur, 0.28);
      },
      cues: () => [
        { t: T.strike, type: "block" },
        ...(r ? [{ t: T.real, type: "approve" }] : []),
      ],
    };
  },
};
