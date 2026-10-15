// Checklist: a title, then items that slide in as cards on the beat. A
// cursor travels to each card and clicks it, and the box fills green. Items
// stay on screen so the last frame can be screenshot.
//
// opts: title, items [string], numbered, start (first number), caption, source,
//       voAt (from the voice-first plan: with one say phrase per item, each
//       item lands as its phrase starts),
//       cursor (default true)
// opts.ladder: { head, tone "alert", steps [string | {text, sub}] } draws the
//   steps as a descending ladder joined by lines that fill in turn.

import { h, clamp, ICON } from "../../lib.js";
import { entryShift, extras, pop, exit, snap, spring } from "./common.js";

const CURSOR = '<svg viewBox="0 0 24 24"><path d="M4 2.5l15 9.2-6.6 1.5 3.9 7.3-2.8 1.5-3.9-7.3L4.9 19z" fill="#0a0a0a" stroke="#fafaf7" stroke-width="1.4" stroke-linejoin="round"/></svg>';

export default {
  build({ dur, opts }) {
    if (opts.ladder) return ladder({ dur, opts });
    const items = opts.items;
    const dense = items.length > 4 || items.some((s) => s.length > 30);
    const el = h("div", `scene c c-list${dense ? " dense" : ""}`);
    const box = h("div", "c-box");
    el.append(box);
    const shift = entryShift(opts);
    const tick = extras(el, opts);

    const title = opts.title ? h("div", "c-title", opts.title) : null;
    if (title) box.append(title);
    const list = h("div", "c-items");
    box.append(list);
    const start = opts.start || 1;
    const rows = items.map((text, i) => {
      const mark = h("div", "c-mark", opts.numbered ? String(start + i) : ICON.check);
      const txt = h("div", "c-txt", text);
      const r = h("div", "c-item");
      r.append(mark, txt);
      list.append(r);
      return { r, mark, txt, ic: mark.querySelector(".ic") };
    });
    const useCursor = opts.cursor !== false;
    const cursor = h("div", "c-cursor", CURSOR);
    const ring = h("div", "c-ring");
    if (useCursor) list.append(ring, cursor);

    // Items arrive on the beat; leave about a quarter of the scene to read.
    const t0 = title ? 0.5 : 0.25;
    const gap = Math.max(0.5, snap(clamp((dur * 0.74 - t0) / items.length, 0.5, 2.2)));
    const synced = opts.voAt && opts.voAt.length === items.length;
    const at = items.map((_, i) => (synced ? Math.max(i === 0 ? 0.05 : 0, opts.voAt[i] - 0.05) : t0 + i * gap));
    const click = at.map((a, i) => a + Math.min(0.45, ((at[i + 1] ?? a + gap) - a) * 0.6));

    let pos = null;
    return {
      el,
      update(t) {
        const te = t + shift;
        if (title) pop(title, te, 0, { dy: 50 });
        rows.forEach((o, i) => {
          pop(o.r, te, at[i], { dx: 140, dy: 0, s0: 0.98, f: 2.6 });
          const on = te >= click[i];
          o.mark.classList.toggle("on", on);
          o.r.classList.toggle("done", on);
          if (o.ic) {
            const p = spring(te, click[i], 3, 0.5);
            o.ic.style.opacity = on ? 1 : 0;
            o.ic.style.transform = `scale(${0.4 + 0.6 * p})`;
          }
        });
        if (useCursor) {
          if (!pos) pos = rows.map((o) => ({ x: o.mark.offsetLeft + o.mark.offsetWidth * 0.62, y: o.r.offsetTop + o.r.offsetHeight * 0.58 }));
          // Travel from the previous item to the next, arriving just before the click.
          let i = 0;
          while (i < at.length - 1 && te >= at[i + 1]) i++;
          const from = i > 0 ? pos[i - 1] : { x: pos[0].x + 260, y: pos[0].y + 160 };
          const p = spring(te, at[i], 2.4, 0.85);
          const x = from.x + (pos[i].x - from.x) * p;
          const y = from.y + (pos[i].y - from.y) * p;
          const press = te >= click[i] && te < click[i] + 0.12 ? 0.86 : 1;
          cursor.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${press})`;
          cursor.style.opacity = clamp((te - at[0]) / 0.15) * (1 - clamp((te - (click[at.length - 1] + 0.8)) / 0.3));
          const rp = clamp((te - click[i]) / 0.4);
          ring.style.opacity = te >= click[i] ? 1 - rp : 0;
          ring.style.transform = `translate3d(${pos[i].x}px, ${pos[i].y}px, 0) scale(${0.4 + rp})`;
        }
        tick(t, te, click[click.length - 1] + 0.5);
        exit(el, t, dur);
      },
      cues: () => [
        ...at.map((a) => ({ t: a, type: "phrase" })),
        ...click.map((c) => ({ t: c, type: "approve" })),
      ],
    };
  },
};

function ladder({ dur, opts }) {
  const L = opts.ladder;
  const el = h("div", `scene c c-list ladder${L.tone === "alert" ? " alert" : ""}`);
  const box = h("div", "c-box");
  el.append(box);
  const shift = entryShift(opts);
  const tick = extras(el, opts);

  const head = h("div", "c-head", `<span class="lamp"></span>${L.head}`);
  box.append(head);
  const list = h("div", "c-items");
  box.append(list);
  const steps = L.steps.map((s, i) => {
    const o = typeof s === "string" ? { text: s } : s;
    let arrow = null, fill = null;
    if (i > 0) {
      arrow = h("div", "c-arrow", "<i><b></b></i>");
      list.append(arrow);
      fill = arrow.querySelector("b");
    }
    const st = h("div", "c-step");
    st.innerHTML = `<div class="card">${o.text}</div>${o.sub ? `<div class="sub">${o.sub}</div>` : ""}`;
    list.append(st);
    return { st, arrow, fill };
  });

  const t0 = 0.4;
  const gap = Math.max(0.5, snap(clamp((dur * 0.72 - t0) / steps.length, 0.5, 2.2)));
  const at = steps.map((_, i) => t0 + i * gap);
  const lamp = head.querySelector(".lamp");

  return {
    el,
    update(t) {
      const te = t + shift;
      pop(head, te, 0, { dy: 30, s0: 0.9 });
      lamp.style.opacity = Math.floor(t * 4) % 2 ? 0.35 : 1;
      steps.forEach((o, i) => {
        if (o.arrow) {
          o.arrow.style.opacity = te >= at[i] - 0.25 ? 1 : 0;
          o.fill.style.transform = `scaleY(${clamp((te - (at[i] - 0.25)) / 0.25)})`;
        }
        pop(o.st, te, at[i], { dy: 50, s0: 0.96 });
        o.st.classList.toggle("on", te >= at[i] + 0.12);
      });
      tick(t, te, 0.5);
      exit(el, t, dur);
    },
    cues: () => [
      ...(L.tone === "alert" ? [{ t: 0.05, type: "alert" }] : []),
      ...at.map((a, i) => ({ t: a + 0.12, type: i === at.length - 1 ? "approve" : "pass" })),
    ],
  };
}
