// Kinetic type: lines that pop in word by word on springs. Words wrapped in
// *asterisks* get a green block that draws in behind them after the line
// lands. Dim lines are grey.
//
// opts: lines [string | {text, dim}], size "xl" | "l" | "m", align "center",
//       eyebrow, source, caption, badge ({ k1, k2 } boxed series badge)

import { h } from "../../lib.js";
import { entryShift, extras, wordLines, scheduleWords, revealWord, pop, exit } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", `scene c c-kin sz-${opts.size || "l"}${opts.align === "center" ? " center" : ""}${opts.badge ? " badge" : ""}`);
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);
    const tick = extras(el, opts);

    if (opts.badge) {
      const b = h("div", "c-badge", `<div class="k1">${opts.badge.k1}</div><div class="k2">${opts.badge.k2}</div>`);
      box.append(b);
      return {
        el,
        update(t) {
          pop(b, t + shift, 0.05, { dy: 0, s0: 0.7, f: 2.2 });
          tick(t, t + shift);
          exit(el, t, dur);
        },
        cues: () => [{ t: 0.05, type: "chime" }],
      };
    }

    const eb = opts.eyebrow ? h("div", "c-eyebrow", opts.eyebrow) : null;
    if (eb) box.append(eb);
    const words = wordLines(box, opts.lines);
    const at = scheduleWords(words, eb ? 0.2 : 0.05, Math.max(0.5, dur * 0.35));
    const last = at[at.length - 1] || 0;
    const hlAt = Math.min(dur - 0.5, last + 0.3);

    return {
      el,
      update(t) {
        const te = t + shift;
        if (eb) pop(eb, te, 0, { dy: 20, s0: 1 });
        words.forEach((w, i) => revealWord(w, te, at[i], opts.first ? Math.max(0.35, hlAt - shift) + shift : hlAt));
        tick(t, te, Math.min(dur * 0.5, last + 0.4));
        exit(el, t, dur);
      },
      cues: () => {
        const c = [];
        if (!opts.first) {
          const lines = [...new Set(words.map((w) => w.line))];
          lines.forEach((li) => c.push({ t: at[words.findIndex((w) => w.line === li)], type: "phrase" }));
        }
        if (words.some((w) => w.mk)) c.push({ t: opts.first ? 0.35 : hlAt, type: "pass" });
        return c;
      },
    };
  },
};
