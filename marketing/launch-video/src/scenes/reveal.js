// 3. Reveal: the logo's green layers stack into place, the real logo lands,
// then the wordmark and "Software you can answer for."

import { h, lines, rise, show, outro, prog, ease, backOut, clamp, LOGO_SRC } from "../lib.js";
import { COPY } from "../copy.js";

export default {
  build({ fmt, dur, opts }) {
    const c = COPY.reveal;
    const k = clamp(dur / 5, 0.5, 1);
    const short = !!opts.short;
    const el = h("div", "scene s-reveal");
    const inner = h("div", "inner");
    el.append(inner);

    const lock = h("div", "lockup");
    const mark = h("div", "mark");
    mark.innerHTML = `
      <div class="burst"></div>
      <div class="ring"></div>
      <div class="lay l1"></div>
      <div class="lay l2"></div>
      <div class="lay l3"></div>
      <img class="logo" src="${LOGO_SRC}" alt="">`;
    const word = h("div", "word", c.word);
    lock.append(mark, word);
    inner.append(lock);

    const hl = lines(inner, [c.lines[0], { text: c.lines[1], cls: "dim" }], "display hl");
    const rule = h("div", "rule");
    inner.append(rule);
    const sub = h("div", "sub", c.sub);
    if (!short) inner.append(sub);

    const [l1, l2, l3] = mark.querySelectorAll(".lay");
    const logo = mark.querySelector(".logo");
    const ring = mark.querySelector(".ring");
    const burst = mark.querySelector(".burst");

    const T = {
      layers: 0,
      hit: 0.5 * k,
      slide: 0.7 * k,
      word: 0.95 * k,
      hl: 1.3 * k,
      rule: 1.95 * k,
      sub: 2.15 * k,
    };
    const row = fmt === "16x9";
    let offset = null, lift = 0;

    return {
      el,
      update(t) {
        // Measure once: how far the mark sits from the lockup centre.
        if (offset === null) {
          offset = row ? (word.offsetWidth + 40) / 2 : (word.offsetHeight + 28) / 2;
          // Until the headline arrives, the lockup sits at the centre of the frame.
          lift = (inner.offsetHeight - lock.offsetHeight) / 2;
        }
        const pUp = prog(t, T.hl - 0.3, 0.75, ease.inOut);
        inner.style.transform = `translate3d(0, calc(-50% + ${lift * (1 - pUp)}px), 0)`;

        // Layers converge from their offsets.
        const pL = prog(t, T.layers, T.hit, ease.out);
        const d = (1 - pL) * 90;
        l1.style.transform = `translate3d(${3.5 + d}%, ${-3.5 - d}%, 0)`;
        l2.style.transform = `translate3d(${-3.5 - d}%, ${3.5 + d}%, 0)`;
        l3.style.transform = `scale(${0.55 + 0.45 * pL})`;
        for (const l of [l1, l2, l3]) l.style.opacity = clamp(pL * 2.5) * (1 - prog(t, T.hit - 0.06, 0.16, ease.linear));

        // The real logo lands with a small punch.
        const pLogo = clamp((t - (T.hit - 0.08)) / 0.14);
        const punch = t >= T.hit ? 1.08 - 0.08 * backOut(clamp((t - T.hit) / 0.45)) : 1;
        logo.style.opacity = pLogo;
        logo.style.transform = `scale(${punch})`;

        const pr = clamp((t - T.hit) / 0.6);
        ring.style.opacity = t >= T.hit ? 0.7 * (1 - pr) * (1 - pr) : 0;
        ring.style.transform = `scale(${0.9 + ease.out(pr) * 1.8})`;
        const pb = clamp((t - T.hit) / 1.4);
        burst.style.opacity = t >= T.hit ? 0.25 + 0.75 * (1 - ease.out(pb)) : 0;

        // Mark slides aside while the wordmark wipes in.
        const ps = prog(t, T.slide, 0.55, ease.inOut);
        const off = (1 - ps) * offset;
        mark.style.transform = row ? `translate3d(${off}px, 0, 0)` : `translate3d(0, ${off}px, 0)`;
        const pw = prog(t, T.word, 0.55, ease.out);
        word.style.clipPath = row ? `inset(0 ${(1 - pw) * 100}% 0 0)` : `inset(0 0 ${(1 - pw) * 100}% 0)`;
        word.style.opacity = pw > 0 ? 1 : 0;
        word.style.transform = row ? `translate3d(${(1 - pw) * -30}px, 0, 0)` : `translate3d(0, ${(1 - pw) * -24}px, 0)`;

        rise(hl.inners, t, T.hl, { stagger: 0.1 });
        rule.style.transform = `scaleX(${prog(t, T.rule, 0.6, ease.out)})`;
        if (!short) show(sub, t, T.sub, 0.6, 16);

        outro(el, t, dur, 0.3);
      },
      cues: () => [
        { t: T.hit - 0.45 * k, type: "riser", dur: 0.45 * k },
        { t: T.hit, type: "impact" },
        { t: T.word, type: "shimmer" },
        { t: T.rule, type: "tick" },
      ],
    };
  },
};
