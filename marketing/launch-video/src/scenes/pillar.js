// Shared text column for the three "what we do" scenes (build, connect,
// automate): number and eyebrow, a two-line title, and chips. In short mode
// (the 15s cut) it is one big word with the number.

import { h, lines, rise, show, slam, prog, ease } from "../lib.js";

export function pillarText(el, c, { short, chips = c.chips || [] }) {
  const col = h("div", "ptext" + (short ? " short" : ""));
  el.append(col);
  const eb = h("div", "eyebrow", `${c.num} · ${c.eyebrow}`);
  col.append(eb);
  let title = null, big = null;
  const chipEls = [];
  if (short) {
    big = h("div", "big display slam", c.short);
    col.append(big);
  } else {
    title = lines(col, [c.title[0], { text: c.title[1], cls: "dim" }], "display hl");
    const row = h("div", "chips");
    for (const t of chips) {
      const ch = h("span", "pchip", t);
      row.append(ch);
      chipEls.push(ch);
    }
    col.append(row);
  }
  return {
    col,
    chips: chipEls,
    // tChips: when the chips start landing
    update(t, tChips = 1.2) {
      show(eb, t, 0, 0.3, 10);
      if (short) {
        slam(big, t, 0.02, 0.3);
        return;
      }
      rise(title.inners, t, 0.06, { stagger: 0.08, d: 0.65 });
      chipEls.forEach((ch, i) => {
        const t0 = tChips + i * 0.22;
        show(ch, t, t0, 0.35, 14);
        ch.style.setProperty("--hot", 1 - prog(t, t0 + 0.15, 0.6, ease.linear));
      });
    },
  };
}
