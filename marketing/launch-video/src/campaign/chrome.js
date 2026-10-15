// Campaign chrome: the "MONTH TWELVE · NN" series badge top left, the small
// QUAICU logo top right, a progress rule, and the block wipe that covers
// every cut between scenes (green and ink, alternating). It steps aside on
// the end card, which carries the big logo.

import { h, prog, ease, clamp, LOGO_SRC } from "../lib.js";

const IN = 0.2, OUT = 0.24;

export function buildCampaignChrome(el, { num, timeline, duration }) {
  el.className = "c-chrome";
  el.innerHTML = `
    <div class="c-wipe"><div class="pan"></div></div>
    <div class="badge"><span class="sq"></span>MONTH TWELVE · <b>${num}</b></div>
    <div class="brand"><img src="${LOGO_SRC}" alt=""><span>QUAICU</span></div>
    <div class="rule"><div class="fill"></div></div>`;
  const fill = el.querySelector(".fill");
  const pan = el.querySelector(".pan");
  const badge = el.querySelector(".badge");
  const brand = el.querySelector(".brand");
  const rule = el.querySelector(".rule");
  const end = timeline.find((s) => s.name === "endcard");
  const endAt = end ? end.start : duration;
  const cuts = timeline.slice(1).map((s) => s.start);

  return {
    update(t) {
      const hide = 1 - prog(t, endAt, 0.25, ease.out);
      for (const e of [badge, brand, rule]) e.style.opacity = hide;
      fill.style.transform = `scaleX(${Math.min(1, t / endAt)})`;

      // Wipe: the panel rises to cover the cut, then carries on up and away.
      let y = 110, k = -1;
      cuts.forEach((c, i) => {
        if (t >= c - IN && t < c + OUT) {
          k = i;
          y = t < c ? 110 * (1 - ease.inOut(clamp((t - (c - IN)) / IN))) : -110 * ease.inOut(clamp((t - c) / OUT));
        }
      });
      pan.style.transform = `translate3d(0, ${y}%, 0) skewY(-6deg)`;
      pan.classList.toggle("ink", k % 2 === 1);
    },
  };
}
