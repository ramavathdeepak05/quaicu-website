// 8. Where QUAICU is built, and the programs it is part of (text only: no
// third-party logos in ads).

import { h, lines, rise, show, outro, prog, ease } from "../lib.js";
import { COPY } from "../copy.js";

export default {
  build({ dur }) {
    const c = COPY.proof;
    const el = h("div", "scene s-proof");
    const inner = h("div", "inner");
    el.append(inner);
    const eb = h("div", "eyebrow grey", c.eyebrow);
    inner.append(eb);
    const hl = lines(inner, [c.lines[0], { text: c.lines[1], cls: "dim" }], "display hl");
    const label = h("div", "plabel", c.label);
    inner.append(label);
    const chips = h("div", "chips");
    const items = c.programs.map((p) => {
      const ch = h("span", "pchip", p);
      chips.append(ch);
      return ch;
    });
    inner.append(chips);

    const T = { eb: 0, hl: 0.1, label: 0.8, chips: 0.95, gap: 0.16 };

    return {
      el,
      update(t) {
        show(eb, t, T.eb, 0.4, 10);
        rise(hl.inners, t, T.hl, { stagger: 0.1 });
        show(label, t, T.label, 0.4, 10);
        items.forEach((it, i) => {
          show(it, t, T.chips + i * T.gap, 0.45, 18);
          it.style.setProperty("--hot", 1 - prog(t, T.chips + i * T.gap + 0.1, 0.7, ease.linear));
        });
        outro(el, t, dur, 0.3);
      },
      cues: () => items.map((_, i) => ({ t: T.chips + i * T.gap, type: "tick" })),
    };
  },
};
