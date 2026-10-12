// 4. Custom software: a fast montage of dashboards built for different
// businesses (sales, operations, finance, real estate, clinics). Each one
// whips in on the beat and its numbers count up live.

import { h, lines, rise, show, outro, prog, ease, clamp, lerp, slam } from "../lib.js";
import { COPY } from "../copy.js";
import { DASHBOARDS } from "../dashboards.js";
import { dashboard } from "../dashboard.js";

export default {
  build({ fmt, dur, opts }) {
    const c = COPY.dash;
    const short = !!opts.short;
    const v = fmt === "9x16";
    const el = h("div", "scene s-dash" + (short ? " short" : ""));

    const head = h("div", "dhead");
    const eb = h("div", "eyebrow", `${c.num} · ${c.eyebrow}`);
    head.append(eb);
    let title = null, big = null;
    if (short) {
      big = h("div", "big display slam", c.short);
      head.append(big);
    } else {
      const rows = v ? c.title9 : c.title;
      title = lines(head, rows.map((t, i) => (i === rows.length - 1 && rows.length > 1 ? { text: t, cls: "dim" } : t)), "display hl");
    }
    el.append(head);

    const stage = h("div", "dstage");
    el.append(stage);
    const tag = h("div", "dtag");
    el.append(tag);

    // One dashboard per beat-aligned slot.
    const s0 = short ? 0.25 : 0.5;
    const slot = short ? 0.5 : dur >= 8 ? 1.5 : 1.0;
    const n = Math.max(1, Math.min(5, Math.floor((dur - s0 + 0.01) / slot)));
    const at = Array.from({ length: n }, (_, i) => s0 + i * slot);
    const speed = short ? 2.8 : slot < 1.2 ? 1.7 : 1.15;
    const boards = DASHBOARDS.slice(0, n).map((cfg) => {
      const d = dashboard(cfg);
      const wrap = h("div", "dwrap");
      wrap.append(d.el);
      stage.append(wrap);
      return { d, wrap, cfg };
    });

    let fit = null;
    return {
      el,
      update(t) {
        if (!fit) {
          const sh = stage.offsetHeight, sw = stage.offsetWidth;
          // A little headroom for the push-in and the 3D tilt.
          fit = boards.map((b) => Math.min(1, (sh * 0.9) / b.d.el.offsetHeight, (sw * 0.96) / b.d.el.offsetWidth));
        }
        show(eb, t, 0, 0.25, 10);
        if (short) slam(big, t, 0.02, 0.28);
        else rise(title.inners, t, 0.04, { stagger: 0.07, d: 0.5 });

        let cur = -1;
        boards.forEach((b, i) => {
          const a = at[i];
          const next = i < n - 1 ? at[i + 1] : Infinity;
          if (t < a - 0.01 || t > next + 0.3) {
            b.wrap.style.display = "none";
            return;
          }
          b.wrap.style.display = "";
          if (t >= a) cur = i;
          // whip in from the right, settle with a slow push, whip out left
          const pin = clamp((t - a) / 0.32);
          const pout = clamp((t - next) / 0.28);
          const x = (1 - ease.out(pin)) * 115 - ease.in(pout) * 115;
          const sk = (1 - ease.out(pin)) * -8 + ease.in(pout) * 8;
          const push = 1 + 0.035 * clamp((t - a) / Math.max(slot, 1.5));
          const sc = fit[i] * (0.94 + 0.06 * ease.out(pin)) * push * (1 - 0.06 * ease.in(pout));
          const ry = lerp(-9, -2, ease.out(clamp((t - a) / 0.8)));
          b.wrap.style.transform = `translate3d(${x}%, 0, 0) skewX(${sk}deg) perspective(2400px) rotateY(${ry}deg) scale(${sc})`;
          b.wrap.style.zIndex = i;
          b.d.update(Math.max(0, t - a), speed);
        });

        // The big tag names the business the current dashboard is for.
        if (cur >= 0) {
          tag.textContent = boards[cur].cfg.tag;
          slam(tag, t, at[cur] + 0.06, 0.26);
        } else tag.style.opacity = 0;

        outro(el, t, dur, short ? 0.12 : 0.22);
      },
      cues: () => at.map((t) => ({ t, type: "whip" })),
    };
  },
};
