// Campaign end card: logo, the line, quaicu.org. Holds still at the end.
// Registered as "endcard" so the score resolves on it like the launch cuts.
//
// opts: lines [string | {text, dim}], url, extra

import { h, show, prog, ease, backOut, clamp, LOGO_SRC } from "../../lib.js";
import { row } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-end");
    const box = h("div", "c-box");
    el.append(box);

    const logo = h("div", "logo", `<div class="glow"></div><img src="${LOGO_SRC}" alt="">`);
    box.append(logo);
    const lines = (opts.lines || ["Software service", { text: "that doesn't fade.", dim: true }]).map(row);
    const lnEls = lines.map((r) => {
      const e = h("div", "ln" + (r.dim ? " dim" : ""), r.text);
      box.append(e);
      return e;
    });
    const rule = h("div", "rule");
    const url = h("div", "url", `<span class="sq"></span>${opts.url || "quaicu.org"}`);
    box.append(rule, url);
    const extra = opts.extra ? h("div", "extra", opts.extra) : null;
    if (extra) box.append(extra);
    const img = logo.querySelector("img");
    const glow = logo.querySelector(".glow");
    const k = clamp(dur / 4, 0.6, 1);

    return {
      el,
      update(t) {
        const pl = clamp((t - 0.05) / 0.6);
        img.style.opacity = clamp(pl * 3);
        img.style.transform = `scale(${0.82 + 0.18 * backOut(pl, 1.4)})`;
        glow.style.opacity = 0.5 + 0.5 * prog(t, 0.05, 1.2, ease.out);
        lnEls.forEach((e, i) => show(e, t, 0.3 * k + i * 0.15, 0.6, 30));
        rule.style.transform = `scaleX(${prog(t, 0.9 * k, 0.6, ease.out)})`;
        show(url, t, 1.1 * k, 0.5, 10);
        if (extra) show(extra, t, 1.3 * k, 0.5, 8);
      },
      cues: () => [{ t: 0, type: "resolve" }, { t: 1.1 * k, type: "cta" }],
    };
  },
};
