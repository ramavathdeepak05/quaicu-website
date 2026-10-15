// Log: the record of every action, rows stamping in one at a time with who
// did it (the AI agent or a person) and when.
//
// opts: title, cols [3 labels], rows [{ time, who, what, kind "ai" | "person" | "ship" }], foot

import { h, prog, ease, clamp } from "../../lib.js";
import { entryShift, extras, pop, exit, snap } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-log");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);
    const tick = extras(el, opts);

    const title = opts.title ? h("div", "c-title", opts.title) : null;
    if (title) box.append(title);
    const tbl = h("div", "tbl");
    const cols = opts.cols || ["Time", "Who", "What"];
    tbl.innerHTML = `<div class="hd"><span>${cols[0]}</span><span>${cols[1]}</span><span>${cols[2]}</span></div>`;
    box.append(tbl);
    const rows = opts.rows.map((r) => {
      const e = h("div", "row");
      e.innerHTML = `<div class="flash"></div><div class="tm">${r.time}</div><div class="who ${r.kind || "ai"}">${r.who}</div><div class="what">${r.what}</div>`;
      tbl.append(e);
      return { e, flash: e.querySelector(".flash") };
    });
    const foot = opts.foot ? h("div", "foot", opts.foot) : null;
    if (foot) box.append(foot);

    const t0 = title ? 0.7 : 0.4;
    const gap = Math.max(0.5, snap(clamp((dur * 0.65 - t0) / rows.length, 0.5, 2)));
    const at = rows.map((_, i) => t0 + i * gap);

    return {
      el,
      update(t) {
        const te = t + shift;
        if (title) pop(title, te, 0, { dy: 50 });
        pop(tbl, te, 0.1, { dy: 60, s0: 0.95 });
        rows.forEach((o, i) => {
          pop(o.e, te, at[i], { dx: 80, dy: 0, s0: 1 });
          o.flash.style.opacity = 1 - prog(te, at[i] + 0.2, 0.9, ease.out);
        });
        if (foot) pop(foot, te, at[at.length - 1] + 0.5, { dy: 10, s0: 1 });
        tick(t, te);
        exit(el, t, dur);
      },
      cues: () => at.map((a) => ({ t: a, type: "stamp" })),
    };
  },
};
