// Stat drop: a huge figure slams in on a spring and counts up, a heavy rule
// draws under it, then the label. Symbols (%, +, –) are set in green.
// A value containing "[FILL]" renders as a red dashed placeholder so it can
// never pass for real data.
//
// opts: value, label, source

import { h, clamp, prog, ease } from "../../lib.js";
import { entryShift, extras, pop, exit } from "./common.js";

const fmt = (s) => s.replace(/([^\d\s.]+)/g, '<span class="acc">$1</span>');

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-stat");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);
    const tick = extras(el, opts);

    const isFill = /\[FILL/.test(opts.value);
    const val = h("div", "val" + (isFill ? " fill" : ""), isFill ? opts.value : fmt(opts.value));
    const bar = h("div", "bar");
    const lbl = h("div", "lbl", opts.label || "");
    box.append(val, bar, lbl);

    const parts = opts.value.split(/(\d+(?:\.\d+)?)/);
    const T = { val: 0.05, count: 0.8, bar: 0.5, lbl: 0.75 };

    // Shrink the figure to fit the width, measured once at its final text.
    let fitted = false;
    const fit = () => {
      fitted = true;
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
        pop(val, te, T.val, { dy: 120, s0: 0.8, f: 2.2 });
        if (!isFill) {
          const p = prog(te, T.val, T.count, ease.out);
          val.innerHTML = fmt(parts.map((s, i) => (i % 2 ? String(Math.round(+s * p)) : s)).join(""));
        }
        bar.style.transform = `scaleX(${prog(te, T.bar, 0.35, ease.out)})`;
        pop(lbl, te, T.lbl, { dy: 40 });
        tick(t, te, 1.2);
        exit(el, t, dur);
      },
      cues: () => (opts.first ? [{ t: 0.05, type: "stamp" }] : [{ t: T.val, type: "stamp" }, { t: T.val + T.count, type: "approve" }]),
    };
  },
};
