// Stat drop: a large figure counts up, a one-line label, and a source line.
// Numbers inside the value ("10–15%", "13 + 9", "40%+") count up together.
// A value containing "[FILL]" renders as a red dashed placeholder so it can
// never pass for real data.
//
// opts: value, label, source

import { h, show, outro, prog, ease } from "../../lib.js";
import { entryShift, extras } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-stat");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);
    const tick = extras(el, opts);

    const isFill = /\[FILL/.test(opts.value);
    const val = h("div", "val" + (isFill ? " fill" : opts.value.length > 6 ? " small" : ""), opts.value);
    const bar = h("div", "bar");
    const lbl = h("div", "lbl", opts.label || "");
    box.append(val, bar, lbl);

    const parts = opts.value.split(/(\d+(?:\.\d+)?)/);
    const T = { val: 0.05, count: 1.1, bar: 0.6, lbl: 0.75 };

    // Shrink the figure to fit the width, measured once at its final text.
    let fitted = false;
    const fit = () => {
      fitted = true;
      val.textContent = opts.value;
      const room = box.clientWidth;
      if (val.scrollWidth > room) {
        const fs = parseFloat(getComputedStyle(val).fontSize);
        val.style.fontSize = `${Math.floor((fs * room) / val.scrollWidth)}px`;
      }
    };

    return {
      el,
      update(t) {
        const te = t + shift;
        if (!fitted) fit();
        show(val, te, T.val, 0.45, 30);
        if (!isFill) {
          const p = prog(te, T.val, T.count, ease.out);
          val.textContent = parts.map((s, i) => (i % 2 ? String(Math.round(+s * p)) : s)).join("");
        }
        bar.style.transform = `scaleX(${prog(te, T.bar, 0.5, ease.out)})`;
        show(lbl, te, T.lbl, 0.5, 18);
        tick(t, te, 1.4);
        outro(el, t, dur, 0.28);
      },
      cues: () => (opts.first ? [] : [{ t: T.val, type: "swell" }, { t: T.val + T.count, type: "stamp" }]),
    };
  },
};
