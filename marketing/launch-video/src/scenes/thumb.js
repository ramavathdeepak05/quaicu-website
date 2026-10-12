// Static layouts for the YouTube thumbnail (16:9) and the Reels/Shorts
// cover (9:16). Not part of any cut.

import { h, LOGO_SRC } from "../lib.js";
import { COPY } from "../copy.js";

export default {
  build() {
    const el = h("div", "scene s-thumb");
    el.innerHTML = `
      <div class="th-logo"><div class="e-glow"></div><img src="${LOGO_SRC}" alt=""></div>
      <div class="inner">
        <div class="eyebrow">${COPY.reveal.word} · ${COPY.chrome.meta}</div>
        <div class="lines display hl"><span class="ln"><span class="ln-i">${COPY.hook.lines[0]}</span></span><span class="ln"><span class="ln-i dim">${COPY.hook.lines[1]}</span></span></div>
        <div class="tag mono"><span class="sq"></span>approver: <b>none</b></div>
        <div class="ans">${COPY.endcard.lines.join(" ")}</div>
      </div>`;
    return { el, update() {} };
  },
};
