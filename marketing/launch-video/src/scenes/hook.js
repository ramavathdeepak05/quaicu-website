// 1. Hook: a production deploy at 2 AM that nobody approved.

import { h, lines, rise, show, outro, prog, typed, blink, backOut, clamp, ICON } from "../lib.js";
import { COPY } from "../copy.js";

export default {
  build({ dur }) {
    const c = COPY.hook;
    const k = Math.min(1, dur / 4);
    const el = h("div", "scene s-hook");
    const inner = h("div", "inner");
    el.append(inner);

    const eb = h("div", "eyebrow grey red", c.eyebrow);
    inner.append(eb);
    const hl = lines(inner, [c.lines[0], { text: c.lines[1], cls: "dim" }], "display hl");

    const term = h("div", "term mono");
    const l1 = h("div", "tl");
    const l2 = h("div", "tl r2");
    term.append(l1, l2);
    inner.append(term);
    l2.innerHTML = `<span class="ok">${ICON.arrow}</span> ${c.result} <span class="none">${c.none}</span>`;
    const none = l2.querySelector(".none");

    const T = {
      hl: 0.05,
      term: 0.8 * k,
      type: 0.9 * k,
      typeDur: 0.75 * k,
    };
    T.res = T.type + T.typeDur + 0.12 * k;
    T.none = T.res + 0.22 * k;
    const cps = c.cmd.length / T.typeDur;

    return {
      el,
      update(t) {
        eb.style.setProperty("--lamp", blink(t, 1.6) ? 1 : 0.25);
        rise(hl.inners, t, T.hl, { stagger: 0.1, d: 0.75 });
        show(term, t, T.term, 0.4, 18);

        const txt = typed(c.cmd, t, T.type, cps);
        const typing = t < T.res;
        l1.innerHTML = `<span class="pr">$</span> ${txt}<span class="caret" style="opacity:${typing && blink(t, 2.4) ? 1 : 0}"></span>`;

        const pr = prog(t, T.res, 0.2);
        l2.style.opacity = pr;
        const pn = clamp((t - T.none) / 0.3);
        none.style.opacity = t >= T.none ? 1 : 0;
        none.style.transform = `scale(${t >= T.none ? 1.35 - 0.35 * backOut(pn) : 1})`;
        // Alert red block flashes, then keeps a slow blink.
        const flash = t >= T.none ? Math.max(1 - pn, blink(t - T.none, 1.1) ? 0.85 : 0.35) : 0;
        none.style.setProperty("--flash", flash);

        outro(el, t, dur, 0.28);
      },
      cues: () => [
        { t: T.type, type: "typing", n: c.cmd.length, cps },
        { t: T.none, type: "alert" },
      ],
    };
  },
};
