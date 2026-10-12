// Frame furniture that sits above or around the scenes.
// - 16:9: the og-card frame (logo and meta on top, location and URL at the
//   bottom, hairlines between), shown once the brand has been revealed.
// - 9:16: a faint marquee low in the frame. Reels and Shorts cover the top
//   and bottom with UI, so nothing there can carry the message.
// - Both: a green wipe sweeps across the frame on every cut.

import { h, prog, ease, clamp, LOGO_SRC } from "./lib.js";
import { COPY } from "./copy.js";

const HIDDEN_BEFORE = ["hook", "tension", "reveal", "thumb"];

export function buildChrome(el, { fmt, timeline }) {
  const first = timeline.find((s) => !HIDDEN_BEFORE.includes(s.name));
  const showAt = first ? first.start : Infinity;
  const cuts = timeline.slice(1).map((s) => s.start);
  const frame = fmt === "16x9" ? buildFrame(el, timeline, showAt, cuts) : buildMarquee(el, showAt);
  const wipe = buildWipe(fmt, cuts);
  return {
    update(t) {
      frame.update(t);
      wipe.update(t);
    },
  };
}

function buildFrame(el, timeline, showAt, cuts) {
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
  const end = timeline.find((s) => s.name === "endcard");

  return {
    update(t) {
      el.style.opacity = prog(t, showAt - 0.1, 0.6, ease.out);
      // The end card shows the big logo, so the small one steps aside.
      brand.style.opacity = end ? 1 - prog(t, end.start, 0.4) : 1;

      // A green light runs along the top rule after each cut (the site's m-sweep).
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
  const unit = COPY.chrome.marquee.map((p) => `<span class="sq"></span>${p}`).join("");
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

// A slanted green band crosses the frame in 0.36s, centred on each cut.
function buildWipe(fmt, cuts) {
  const W = fmt === "16x9" ? 1920 : 1080;
  const el = h("div", "wipe");
  document.getElementById("stage").append(el);
  const half = 0.18;
  return {
    update(t) {
      const ct = cuts.find((c) => t >= c - half && t < c + half);
      if (ct === undefined) {
        el.style.opacity = 0;
        return;
      }
      const u = (t - (ct - half)) / (2 * half);
      el.style.opacity = 1;
      el.style.transform = `translate3d(${-500 + ease.inOut(u) * (W + 1000)}px, 0, 0) skewX(-14deg)`;
    },
  };
}
