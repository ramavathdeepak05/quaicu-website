// Checklist: a title, then items arriving one at a time with a tick (or a
// number). Everything stays on screen so the last frame can be screenshot.
//
// opts: title, items [string], numbered, start (first number), caption, source,
//       voItems [string] (voiceover: one line per item, timed to the item)
// opts.ladder: { head, tone "alert", steps [string | {text, sub}] } draws the
//   steps as a descending ladder joined by arrows that light up in turn.

import { h, show, outro, prog, ease, backOut, clamp, ICON } from "../../lib.js";
import { entryShift, extras } from "./common.js";

export default {
  build({ dur, opts }) {
    if (opts.ladder) return ladder({ dur, opts });
    const items = opts.items;
    const dense = items.length > 4 || items.some((s) => s.length > 34);
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

    // Leave about a third of the scene to read the full list.
    const t0 = title ? 0.55 : 0.2;
    const gap = clamp((dur * 0.62 - t0) / items.length, 0.45, 2.2);
    const at = items.map((_, i) => t0 + i * gap);

    return {
      el,
      update(t) {
        const te = t + shift;
        if (title) show(title, te, 0.05, 0.55, 18);
        rows.forEach((o, i) => {
          show(o.r, te, at[i], 0.45, 26);
          const pm = clamp((te - at[i] - 0.12) / 0.35);
          o.mark.classList.toggle("on", pm > 0);
          if (o.ic) {
            o.ic.style.opacity = clamp(pm * 2);
            o.ic.style.transform = `scale(${0.5 + 0.5 * backOut(pm, 2)})`;
          }
        });
        tick(t, te, at[at.length - 1] + 0.6);
        outro(el, t, dur, 0.28);
      },
      cues: () => [
        ...at.map((a) => ({ t: a + 0.12, type: opts.numbered ? "pass" : "tick" })),
        // opts.voItems: one narration line per item, spoken as the item lands.
        ...(opts.voItems || []).map((text, i) => ({ t: at[i] + 0.05, type: "vo", text })),
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

  const t0 = 0.45;
  const gap = clamp((dur * 0.7 - t0) / steps.length, 0.5, 2.2);
  const at = steps.map((_, i) => t0 + i * gap);
  const lamp = head.querySelector(".lamp");

  return {
    el,
    update(t) {
      const te = t + shift;
      show(head, te, 0.05, 0.45, 14);
      lamp.style.opacity = L.tone === "alert" ? (Math.floor(t * 3) % 2 ? 0.35 : 1) : 1;
      steps.forEach((o, i) => {
        if (o.arrow) {
          show(o.arrow, te, at[i] - 0.3, 0.3, 0);
          o.fill.style.transform = `scaleY(${prog(te, at[i] - 0.3, 0.35, ease.out)})`;
        }
        show(o.st, te, at[i], 0.45, 22);
        o.st.classList.toggle("on", te >= at[i] + 0.15);
      });
      tick(t, te, 0.6);
      outro(el, t, dur, 0.28);
    },
    cues: () => [
      ...(L.tone === "alert" ? [{ t: 0.1, type: "alert" }] : []),
      ...at.map((a, i) => ({ t: a + 0.15, type: i === at.length - 1 ? "approve" : "pass" })),
    ],
  };
}
