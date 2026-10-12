// Static layouts for the YouTube thumbnail (16:9) and the Reels/Shorts
// cover (9:16). Not part of any cut.

import { h, ICON, LOGO_SRC } from "../lib.js";
import { COPY } from "../copy.js";

export default {
  build() {
    const c = COPY.thumb;
    const el = h("div", "scene s-thumb");
    el.innerHTML = `
      <div class="th-logo"><div class="e-glow"></div><img src="${LOGO_SRC}" alt=""></div>
      <div class="inner">
        <div class="eyebrow">${c.eyebrow}</div>
        <div class="lines display hl">${c.lines.map((t, i) => `<span class="ln"><span class="ln-i${i === 2 ? " g" : ""}">${t}</span></span>`).join("")}</div>
        <div class="tag">${ICON.check}<span>${c.tag}</span></div>
      </div>`;
    return { el, update() {} };
  },
};
