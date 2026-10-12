// 8. How to start: support priced per ticket (the ticket journey from
// support.html) or a new build (the build timeline from builds.html), with
// one relationship manager.

import { h, lines, rise, show, outro, prog, ease, clamp, lerp, voTimes, ICON } from "../lib.js";
import { COPY } from "../copy.js";

export default {
  build({ dur, opts, vo }) {
    const c = COPY.engage;
    const short = !!opts.short;
    const el = h("div", "scene s-offer" + (short ? " short" : ""));
    const hl = lines(el, [c.lines[0], { text: c.lines[1], cls: "dim" }], "display hl");
    const rm = h("div", "rm", `${ICON.person}<span>${c.rm}</span>`);
    el.append(rm);

    const panels = h("div", "panels");
    el.append(panels);

    // Panel 01: ticket journey
    const p1 = h("div", "panel p1");
    const s = c.support;
    p1.innerHTML = `
      <div class="eyebrow">${s.eyebrow}</div>
      <div class="pt"><span>${s.white}</span><span class="dim">${s.grey}</span></div>
      <div class="journey">
        <div class="track"><div class="fill"></div></div>
        ${s.stages.map((st, i) => `<div class="node n${i}" style="left:${(i / (s.stages.length - 1)) * 100}%"><span class="sq"></span><span class="nl">${st}</span></div>`).join("")}
        <div class="chip">${s.ticket}</div>
      </div>
      <div class="done">${ICON.check}<span>${s.done}</span></div>`;
    panels.append(p1);

    // Panel 02: build timeline
    const p2 = h("div", "panel p2");
    const b = c.builds;
    p2.innerHTML = `
      <div class="eyebrow">${b.eyebrow}</div>
      <div class="pt"><span>${b.white}</span><span class="dim">${b.grey}</span></div>
      <div class="phases">
        ${b.stages.map((st) => `<div class="ph"><div class="ph-l">${st}</div><div class="bar"><div class="bfill"></div></div><div class="stamp">${ICON.check}${b.stamp}</div></div>`).join("")}
      </div>`;
    panels.append(p2);

    const nodes = [...p1.querySelectorAll(".node")];
    const fill = p1.querySelector(".fill");
    const chip = p1.querySelector(".chip");
    const done = p1.querySelector(".done");
    const phs = [...p2.querySelectorAll(".ph")];

    // Timings: both panels run together; the RM chip lands with its line.
    const T = { hl: 0.05, p1: 0.35, p2: 0.5, j0: 0.9, j1: dur * 0.62, b0: 1.0, b1: dur * 0.68 };
    const tRm = voTimes(vo, 2, [0, dur * 0.5])[1];
    const nSt = nodes.length;
    // Ticket arrival times at each node (dwell longer at Review).
    const w = [0, 1, 1.3, 1];
    const wSum = w.reduce((a, x) => a + x, 0);
    const arrive = [];
    let acc = 0;
    for (let i = 0; i < nSt; i++) {
      acc += w[i];
      arrive.push(T.j0 + ((T.j1 - T.j0) * acc) / wSum);
    }
    const phT = phs.map((_, i) => {
      const span = (T.b1 - T.b0) / phs.length;
      return { a: T.b0 + i * span, b: T.b0 + i * span + span * 0.72 };
    });

    return {
      el,
      update(t) {
        rise(hl.inners, t, T.hl, { stagger: 0.1 });
        show(p1, t, T.p1, 0.6, 30);
        show(p2, t, T.p2, 0.6, 30);

        show(rm, t, tRm, 0.4, 14);
        rm.style.setProperty("--hot", 1 - prog(t, tRm + 0.15, 0.8, ease.linear));

        // Journey: the chip hops node to node.
        let x = 0;
        for (let i = 1; i < nSt; i++) {
          const pi = prog(t, arrive[i] - 0.42, 0.42, ease.inOut);
          x += pi / (nSt - 1);
        }
        chip.style.left = x * 100 + "%";
        chip.style.opacity = prog(t, T.j0 - 0.3, 0.3);
        fill.style.transform = `scaleX(${x})`;
        nodes.forEach((n, i) => n.style.setProperty("--on", prog(t, arrive[i] - 0.05, 0.2)));
        show(done, t, arrive[nSt - 1] + 0.1, 0.45, 10);

        // Build phases fill, then get stamped.
        phs.forEach((ph, i) => {
          const { a, b } = phT[i];
          ph.querySelector(".bfill").style.transform = `scaleX(${prog(t, a, b - a, ease.inOut)})`;
          const st = ph.querySelector(".stamp");
          const ps = clamp((t - b) / 0.3);
          st.style.opacity = ps > 0 ? 1 : 0;
          st.style.transform = `scale(${t >= b ? lerp(1.3, 1, ease.out(ps)) : 1})`;
          ph.style.setProperty("--on", prog(t, a, 0.3));
        });

        outro(el, t, dur, 0.3);
      },
      cues: () => [
        ...arrive.map((t, i) => ({ t, type: i === nSt - 1 ? "chime" : "tick" })),
        ...phT.map((p) => ({ t: p.b, type: "approve" })),
        { t: tRm, type: "tick" },
      ],
    };
  },
};
