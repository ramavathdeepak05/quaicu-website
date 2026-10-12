// 9. End card, laid out like og-card.png: eyebrow, the headline, what we do,
// a green rule, "Talk to us" and quaicu.org, with the logo. Holds still at
// the end.

import { h, lines, rise, show, prog, ease, backOut, clamp, ICON, LOGO_SRC } from "../lib.js";
import { COPY } from "../copy.js";

export default {
  build({ dur }) {
    const c = COPY.endcard;
    const k = clamp(dur / 6, 0.6, 1);
    const el = h("div", "scene s-end");

    const logoBox = h("div", "e-logo");
    logoBox.innerHTML = `<div class="e-glow"></div><img src="${LOGO_SRC}" alt="">`;
    el.append(logoBox);

    const inner = h("div", "inner");
    el.append(inner);
    const eb = h("div", "eyebrow", c.eyebrow);
    inner.append(eb);
    const hl = lines(inner, [c.lines[0], { text: c.lines[1], cls: "dim" }], "display hl");
    const sub = h("div", "esub", c.sub);
    inner.append(sub);
    const rule = h("div", "rule");
    inner.append(rule);
    const ctaRow = h("div", "cta-row");
    ctaRow.innerHTML = `<span class="btn">${c.cta} ${ICON.arrow}</span><span class="url"><span class="sq"></span>${c.url}</span>`;
    inner.append(ctaRow);
    const btn = ctaRow.querySelector(".btn");
    const url = ctaRow.querySelector(".url");
    const img = logoBox.querySelector("img");
    const glow = logoBox.querySelector(".e-glow");

    const T = { logo: 0.05, eb: 0.15 * k, hl: 0.25 * k, rule: 0.85 * k, btn: 1.0 * k, url: 1.2 * k };

    return {
      el,
      update(t) {
        const pl = clamp((t - T.logo) / 0.6);
        img.style.opacity = clamp(pl * 3);
        img.style.transform = `scale(${0.82 + 0.18 * backOut(pl, 1.4)})`;
        glow.style.opacity = 0.55 + 0.45 * prog(t, T.logo, 1.2, ease.out);

        show(eb, t, T.eb, 0.5, 12);
        rise(hl.inners, t, T.hl, { stagger: 0.1 });
        show(sub, t, T.rule - 0.15, 0.5, 10);
        rule.style.transform = `scaleX(${prog(t, T.rule, 0.6, ease.out)})`;
        const pb = clamp((t - T.btn) / 0.5);
        btn.style.opacity = clamp(pb * 2);
        btn.style.transform = `scale(${t >= T.btn ? 0.9 + 0.1 * backOut(pb, 1.6) : 0.9})`;
        show(url, t, T.url, 0.5, 10);
      },
      cues: () => [
        { t: 0, type: "resolve" },
        { t: T.btn, type: "cta" },
      ],
    };
  },
};
