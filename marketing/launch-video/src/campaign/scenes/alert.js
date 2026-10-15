// Alert: the 2:14 AM production incident that opens V08, echoing the launch
// video's hook. Red lamp, headline, and a terminal showing the outage.
//
// opts: eyebrow, lines [string | {text, dim}], term [string] (prefix "!" for
//       an error line, "#" for a muted line)

import { h, show, outro, blink } from "../../lib.js";
import { entryShift, wordLines, scheduleWords, revealWord } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-alert");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);

    const eb = h("div", "c-eyebrow", opts.eyebrow);
    box.append(eb);
    const hl = h("div", "hl");
    box.append(hl);
    const words = wordLines(hl, opts.lines);
    const at = scheduleWords(words, 0.25, dur * 0.35);
    const term = h("div", "term");
    term.innerHTML = (opts.term || [])
      .map((l) => {
        if (l.startsWith("!")) return `<div class="er">${l.slice(1)}</div>`;
        if (l.startsWith("#")) return `<div class="mt">${l.slice(1)}</div>`;
        return `<div><span class="pr">$</span> ${l}</div>`;
      })
      .join("");
    box.append(term);
    const lines = [...term.children];

    return {
      el,
      update(t) {
        const te = t + shift;
        show(eb, te, 0, 0.4, 8);
        eb.style.opacity = blink(t, 1.4) ? 1 : 0.55;
        words.forEach((w, i) => revealWord(w.el, te, at[i]));
        show(term, te, 0.6, 0.45, 18);
        lines.forEach((l, i) => (l.style.opacity = te >= 0.7 + i * 0.35 ? 1 : 0));
        outro(el, t, dur, 0.28);
      },
      cues: () => [{ t: 0.05, type: "alert" }, { t: 1.2, type: "alert" }],
    };
  },
};
