// Stages: a ticket moving down a vertical track (Raised, Engine, Review,
// Delivered). Each stage lights up in turn and a ticket chip follows it.
//
// opts: stages [{ name, sub }], ticket (chip label), title

import { h, show, outro, prog, ease, clamp } from "../../lib.js";
import { entryShift, extras } from "./common.js";

export default {
  build({ dur, opts }) {
    const el = h("div", "scene c c-stages");
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);
    const tick = extras(el, opts);

    const title = opts.title ? h("div", "c-title", opts.title) : null;
    if (title) box.append(title);
    const wrap = h("div", "");
    wrap.style.position = "relative";
    box.append(wrap);
    const rail = h("div", "rail", "<b></b>");
    const list = h("div", "list");
    wrap.append(rail, list);
    const railFill = rail.querySelector("b");
    const rows = opts.stages.map((s, i) => {
      const st = h("div", "st");
      st.innerHTML = `<div class="node">${String(i + 1).padStart(2, "0")}</div><div><div class="nm">${s.name}</div>${s.sub ? `<div class="sb">${s.sub}</div>` : ""}</div>`;
      list.append(st);
      return st;
    });
    const chip = h("div", "chip", opts.ticket || "TCK-2041");
    wrap.append(chip);

    const n = rows.length;
    const t0 = title ? 0.6 : 0.3;
    const gap = clamp((dur * 0.72 - t0) / n, 0.6, 2.4);
    const at = rows.map((_, i) => t0 + i * gap);

    return {
      el,
      update(t) {
        const te = t + shift;
        if (title) show(title, te, 0.05, 0.5, 18);
        show(list, te, 0.1, 0.5, 20);
        let cur = -1;
        rows.forEach((st, i) => {
          const on = te >= at[i];
          st.classList.toggle("on", on);
          if (on) cur = i;
        });
        rows.forEach((st, i) => st.classList.toggle("cur", i === cur));
        railFill.style.transform = `scaleY(${clamp(prog(te, at[0], at[n - 1] - at[0] + 0.01, ease.inOut))})`;
        if (cur >= 0) {
          const r = rows[cur];
          const y = r.offsetTop + 14;
          const prev = cur > 0 ? rows[cur - 1].offsetTop + 14 : y;
          const p = prog(te, at[cur], 0.45, ease.out);
          chip.style.top = `${prev + (y - prev) * p}px`;
          chip.style.opacity = clamp((te - at[0]) / 0.3);
        } else {
          chip.style.opacity = 0;
        }
        tick(t, te, at[n - 1] + 0.6);
        outro(el, t, dur, 0.28);
      },
      cues: () => at.map((a, i) => ({ t: a, type: i === n - 1 ? "stamp" : i === n - 2 ? "approve" : "pass" })),
    };
  },
};
