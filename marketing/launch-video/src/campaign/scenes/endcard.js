// Campaign end card: logo, the line, quaicu.org. Holds still at the end.
// Registered as "endcard" so the score resolves on it like the launch cuts.
//
// opts: lines [string | {text, dim}] (dim lines are set in green), url, extra

import { h, clamp, prog, ease } from "../../lib.js";
import { row, pop, spring } from "./common.js";
import { LOGO_SRC } from "../../lib.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-end");
    const box = h("div", "c-box");
    el.append(box);

    const logo = h("div", "logo", `<img src="${LOGO_SRC}" alt="">`);
    box.append(logo);
    const lines = (opts.lines || ["Software service", { text: "that doesn’t fade.", dim: true }]).map(row);
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

    return {
      el,
      update(t) {
        const pl = spring(t, 0.05, 1.8, 0.45);
        img.style.opacity = clamp((t - 0.05) / 0.1);
        img.style.transform = `scale(${0.4 + 0.6 * pl}) rotate(${(1 - pl) * -12}deg)`;
        lnEls.forEach((e, i) => pop(e, t, 0.3 + i * 0.12, { dy: 60 }));
        rule.style.transform = `scaleX(${prog(t, 0.75, 0.35, ease.out)})`;
        pop(url, t, 1.0, { dy: 30, s0: 0.85 });
        if (extra) pop(extra, t, 1.25, { dy: 10, s0: 1 });
      },
      cues: () => [{ t: 0, type: "resolve" }, { t: 0.05, type: "impact" }, { t: 1.0, type: "cta" }],
    };
  },
};
