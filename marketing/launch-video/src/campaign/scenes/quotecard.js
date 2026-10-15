// Quote card: a buyer's words type in, with an attribution line. An optional
// response line slides in afterwards while the quote dims.
//
// opts: quote, attribution, response

import { h, show, outro, prog, clamp, typed, blink } from "../../lib.js";
import { entryShift } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-quote");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);

    const qm = h("div", "qm", "“");
    const q = h("div", "q");
    const att = h("div", "att", opts.attribution || "");
    box.append(qm, q, att);
    const resp = opts.response ? h("div", "resp", opts.response) : null;
    if (resp) box.append(resp);

    const text = opts.quote;
    const typeEnd = Math.min(dur * 0.45, 2.6);
    const cps = text.length / typeEnd;
    const T = { type: 0.2, att: typeEnd + 0.3, resp: typeEnd + 1.0 };

    return {
      el,
      update(t) {
        const te = t + shift;
        show(qm, te, 0, 0.4, 20);
        const s = typed(text, te, T.type, cps);
        const done = s.length >= text.length;
        q.innerHTML = s + `<span class="caret" style="opacity:${done ? (blink(t, 1.2) ? 1 : 0) : 1}"></span>`;
        show(att, te, T.att, 0.45, 10);
        if (resp) {
          const p = show(resp, t, T.resp, 0.55, 24);
          q.style.opacity = 1 - 0.55 * p;
        }
        outro(el, t, dur, 0.28);
      },
      cues: () => [
        ...(opts.first ? [] : [{ t: T.type, type: "typing", n: text.length, cps }]),
        ...(resp ? [{ t: T.resp, type: "phrase" }] : []),
      ],
    };
  },
};
