// Kinetic type: one to three lines revealed word by word. White lines first,
// then dim (grey) lines after a pause, like the launch video's tension scene.
//
// opts: lines [string | {text, dim}], size "xl" | "l" | "m", align "center",
//       eyebrow, source, caption, badge ({ k1, k2 } boxed series badge)

import { h, outro, show, prog, ease, backOut, clamp } from "../../lib.js";
import { entryShift, extras, wordLines, scheduleWords, revealWord } from "./common.js";

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
          const te = t + shift;
          const p = clamp((te - 0.1) / 0.6);
          b.style.opacity = clamp(p * 2);
          b.style.transform = `scale(${0.86 + 0.14 * backOut(p, 1.5)})`;
          tick(t, te);
          outro(el, t, dur, 0.28);
        },
        cues: () => [{ t: 0.1, type: "chime" }],
      };
    }

    const eb = opts.eyebrow ? h("div", "c-eyebrow", opts.eyebrow) : null;
    if (eb) box.append(eb);
    const words = wordLines(box, opts.lines);
    const at = scheduleWords(words, eb ? 0.3 : 0.12, Math.max(0.6, dur * 0.45));

    return {
      el,
      update(t) {
        const te = t + shift;
        if (eb) show(eb, te, 0.05, 0.5, 10);
        words.forEach((w, i) => revealWord(w.el, te, at[i]));
        tick(t, te, Math.min(dur * 0.5, at[at.length - 1] + 0.4));
        outro(el, t, dur, 0.28);
      },
      cues: () => {
        if (opts.first) return [];
        const lines = [...new Set(words.map((w) => w.line))];
        return lines.map((li) => ({ t: at[words.findIndex((w) => w.line === li)], type: "phrase" }));
      },
    };
  },
};
