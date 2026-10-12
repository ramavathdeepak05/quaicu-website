// "Every number, live." A wall of dashboards: the camera starts inside one
// and pulls back to show them all running, then each gets its approval.

import { h, outro, prog, ease, clamp, lerp, backOut, slam, ICON } from "../lib.js";
import { COPY } from "../copy.js";
import { DASHBOARDS } from "../dashboards.js";
import { dashboard } from "../dashboard.js";

export default {
  build({ fmt, dur }) {
    const c = COPY.live;
    const v = fmt === "9x16";
    const el = h("div", "scene s-live");
    const head = h("div", "lhead display");
    const l1 = h("div", "slam", c.lines[0]);
    const l2 = h("div", "slam dim", c.lines[1]);
    head.append(l1, l2);
    el.append(head);

    const clip = h("div", "wclip");
    const wall = h("div", "wall");
    clip.append(wall);
    el.append(clip);
    const cols = v ? 2 : 3;
    const N = v ? 4 : 6;
    const tiles = DASHBOARDS.slice(0, N).map((cfg) => {
      const tile = h("div", "tile");
      const d = dashboard(cfg);
      const inner = h("div", "tin");
      inner.append(d.el);
      const stamp = h("div", "tstamp", `${ICON.check}<span>${c.stamp}</span>`);
      tile.append(inner, stamp);
      wall.append(tile);
      return { tile, inner, d, stamp };
    });

    const T = { l1: 0.05, zoom: 0.2, zoomD: 1.3, l2: 2.4, stamps: 2.7 };
    let geo = null;
    return {
      el,
      update(t) {
        if (!geo) {
          const W = wall.offsetWidth, H = wall.offsetHeight, gap = 24;
          const rows = Math.ceil(N / cols);
          const tw = (W - gap * (cols - 1)) / cols, th = (H - gap * (rows - 1)) / rows;
          tiles.forEach((tl, i) => {
            const x = (i % cols) * (tw + gap), y = Math.floor(i / cols) * (th + gap);
            Object.assign(tl.tile.style, { left: x + "px", top: y + "px", width: tw + "px", height: th + "px" });
            const s = Math.min(tw / tl.d.el.offsetWidth, th / tl.d.el.offsetHeight);
            tl.inner.style.transform = `translate(-50%, -50%) scale(${s})`;
          });
          geo = { W, H, tw, th, S0: Math.min(W / tw, H / th) * 0.98 };
        }
        slam(l1, t, T.l1, 0.3);
        slam(l2, t, T.l2, 0.3);

        // Pull back from the first dashboard to the whole wall.
        const p = ease.inOut(clamp((t - T.zoom) / T.zoomD));
        const s = lerp(geo.S0, 1, p);
        const cx = geo.tw / 2, cy = geo.th / 2;
        const tx = lerp(geo.W / 2 - cx * geo.S0, 0, p);
        const ty = lerp(geo.H / 2 - cy * geo.S0, 0, p);
        wall.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;

        tiles.forEach((tl, i) => {
          tl.d.update(Math.max(0, t - i * 0.12), 1.4);
          const ts = T.stamps + i * 0.13;
          const ps = clamp((t - ts) / 0.3);
          tl.stamp.style.opacity = clamp(ps * 3);
          tl.stamp.style.transform = `scale(${t >= ts ? lerp(1.5, 1, backOut(ps, 1.6)) : 1.5})`;
          tl.tile.style.setProperty("--ok", t >= ts ? 1 - 0.5 * clamp((t - ts) / 0.6) : 0);
        });
        outro(el, t, dur, 0.22);
      },
      cues: () => [
        { t: T.l1, type: "slam" },
        { t: T.zoom, type: "whip" },
        { t: T.l2, type: "slam" },
        ...tiles.map((_, i) => ({ t: T.stamps + i * 0.13, type: "approve" })),
      ],
    };
  },
};
