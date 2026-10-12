// The og-card frame for 16:9: logo and meta on top, location and URL at the
// bottom, hairlines between. It shows once the brand has been revealed, and
// a green light runs along the top rule at every cut (the site's m-sweep).
// 9:16 gets only a faint marquee low in the frame: Reels and Shorts cover
// the top and bottom with UI, so nothing there can carry the message.

import { h, prog, ease, clamp, LOGO_SRC } from "./lib.js";
import { COPY } from "./copy.js";

const HIDDEN_BEFORE = ["hook", "tension", "reveal", "thumb"];

export function buildChrome(el, { fmt, timeline }) {
  const first = timeline.find((s) => !HIDDEN_BEFORE.includes(s.name));
  const showAt = first ? first.start : Infinity;
  if (fmt !== "16x9") return buildMarquee(el, showAt);
  const c = COPY.chrome;

  el.className = "chrome";
  el.innerHTML = `
    <div class="top">
      <div class="brand"><img src="${LOGO_SRC}" alt=""><span>QUAICU</span></div>
      <div class="meta">${c.meta}</div>
    </div>
    <div class="rule t"><div class="sweep"></div></div>
    <div class="rule b"></div>
    <div class="bot">
      <div class="meta">${c.place}</div>
      <div class="meta url"><span class="sq"></span>${c.url}</div>
    </div>`;
  const brand = el.querySelector(".brand");
  const sweep = el.querySelector(".sweep");

  // Chrome fades in at the first scene after the reveal.
  const end = timeline.find((s) => s.name === "endcard");
  const cuts = timeline.slice(1).map((s) => s.start);

  return {
    update(t) {
      const p = prog(t, showAt - 0.1, 0.6, ease.out);
      el.style.opacity = p;
      // The end card shows the big logo, so the small one steps aside.
      brand.style.opacity = end ? 1 - prog(t, end.start, 0.4) : 1;

      let s = -1;
      for (const ct of cuts) if (t >= ct - 0.05 && t < ct + 0.9) s = clamp((t - ct + 0.05) / 0.95);
      if (s >= 0) {
        sweep.style.opacity = Math.sin(s * Math.PI);
        sweep.style.transform = `translate3d(${ease.inOut(s) * 1980 - 360}px, 0, 0)`;
      } else {
        sweep.style.opacity = 0;
      }
    },
  };
}

function buildMarquee(el, showAt) {
  el.className = "marquee";
  const unit = COPY.pipeline.phrases.concat(COPY.chrome.meta + ".").map((p) => `<span class="sq"></span>${p}`).join("");
  el.innerHTML = `<div class="mq-rule"></div><div class="mq-track"><span>${unit}</span><span>${unit}</span></div><div class="mq-rule"></div>`;
  const track = el.querySelector(".mq-track");
  let w = null;
  return {
    update(t) {
      if (w === null) w = track.firstElementChild.offsetWidth;
      el.style.opacity = prog(t, showAt - 0.1, 0.6, ease.out);
      track.style.transform = `translate3d(${-((t * 60) % w)}px, 0, 0)`;
    },
  };
}
