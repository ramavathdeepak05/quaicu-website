// Static layouts for the YouTube thumbnail (16:9) and the Reels/Shorts
// cover (9:16): the three offerings, the logo, and a live dashboard.

import { h, ICON, LOGO_SRC } from "../lib.js";
import { COPY } from "../copy.js";
import { DASHBOARDS } from "../dashboards.js";
import { dashboard } from "../dashboard.js";

export default {
  build() {
    const c = COPY.thumb;
    const el = h("div", "scene s-thumb");
    el.innerHTML = `
      <div class="th-dash"></div>
      <div class="th-logo"><div class="e-glow"></div><img src="${LOGO_SRC}" alt=""></div>
      <div class="inner">
        <div class="eyebrow">${c.eyebrow}</div>
        <div class="lines display hl">${c.lines.map((t, i) => `<span class="ln"><span class="ln-i${i === 2 ? " g" : ""}">${t}</span></span>`).join("")}</div>
        <div class="tag">${ICON.check}<span>${c.tag}</span></div>
      </div>`;
    const d = dashboard(DASHBOARDS[0]);
    el.querySelector(".th-dash").append(d.el);
    return { el, update: () => d.update(1.19) };
  },
};
