// Campaign chrome: the "MONTH TWELVE · NN" series badge top left, the small
// QUAICU logo top right, and a hairline that fills as the video plays.
// It steps aside on the end card, which carries the big logo.

import { h, prog, ease, LOGO_SRC } from "../lib.js";

export function buildCampaignChrome(el, { num, timeline, duration }) {
  el.className = "c-chrome";
  el.innerHTML = `
    <div class="badge"><span class="sq"></span>MONTH TWELVE · <b>${num}</b></div>
    <div class="brand"><img src="${LOGO_SRC}" alt=""><span>QUAICU</span></div>
    <div class="rule"><div class="fill"></div></div>`;
  const fill = el.querySelector(".fill");
  const end = timeline.find((s) => s.name === "endcard");
  const endAt = end ? end.start : duration;
  return {
    update(t) {
      el.style.opacity = 1 - prog(t, endAt, 0.35, ease.out);
      fill.style.transform = `scaleX(${Math.min(1, t / endAt)})`;
    },
  };
}
