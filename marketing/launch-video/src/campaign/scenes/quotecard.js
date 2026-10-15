// Quote card: a buyer's words type fast into a solid ink card, with an
// attribution line. An optional response line pops in below.
//
// opts: quote, attribution, response

import { h, clamp, typed, blink } from "../../lib.js";
import { entryShift, pop, exit } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-quote");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);

    const card = h("div", "card");
    const qm = h("div", "qm", "“");
    const q = h("div", "q");
    const att = h("div", "att", opts.attribution || "");
    card.append(qm, q, att);
    box.append(card);
    const resp = opts.response ? h("div", "resp", opts.response) : null;
    if (resp) box.append(resp);

    const text = opts.quote;
    const typeEnd = Math.min(dur * 0.35, 1.6);
    const cps = text.length / typeEnd;
    const T = { type: 0.15, att: typeEnd + 0.25, resp: typeEnd + 0.75 };

    return {
      el,
      update(t) {
        const te = t + shift;
        pop(card, te, 0, { dy: 80, s0: 0.92 });
        const s = typed(text, te, T.type, cps);
        const done = s.length >= text.length;
        q.innerHTML = s + `<span class="caret" style="opacity:${done ? (blink(t, 1.6) ? 1 : 0) : 1}"></span>`;
        pop(att, te, T.att, { dy: 14, s0: 1 });
        if (resp) pop(resp, t, T.resp, { dy: 50 });
        exit(el, t, dur);
      },
      cues: () => [
        ...(opts.first ? [] : [{ t: T.type, type: "typing", n: text.length, cps }]),
        ...(resp ? [{ t: T.resp, type: "phrase" }] : []),
      ],
    };
  },
};
