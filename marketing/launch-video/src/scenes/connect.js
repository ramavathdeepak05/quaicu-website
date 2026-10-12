// 5. Integrations: SAP, Salesforce and the rest around a QUAICU hub. Systems
// light up as the voiceover names them, then a real sync runs through:
// deal won in Salesforce -> sales order in SAP -> invoice -> WhatsApp update.

import { h, show, outro, prog, ease, clamp, lerp, backOut, ICON, LOGO_SRC } from "../lib.js";
import { COPY } from "../copy.js";
import { pillarText } from "./pillar.js";

export default {
  build({ fmt, dur, opts, vo }) {
    const c = COPY.connect;
    const short = !!opts.short;
    const v = fmt === "9x16";
    const el = h("div", "scene s-pillar s-connect" + (short ? " short" : ""));
    const text = pillarText(el, c, { short, chips: [] });

    const names = [...c.systems, c.any];
    const N = names.length;
    const R = v ? 300 : 310;
    const S = 2 * R + 260;
    const C = S / 2;
    const ang = (i) => -Math.PI / 2 + (i / N) * Math.PI * 2;
    const P = names.map((_, i) => [C + Math.cos(ang(i)) * R, C + Math.sin(ang(i)) * R * (v ? 0.86 : 0.82)]);

    const hub = h("div", "hubx");
    hub.style.width = hub.style.height = S + "px";
    hub.innerHTML = `
      <svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
        ${P.map(([x, y], i) => `<line class="sp${i === N - 1 ? " any" : ""}" x1="${C}" y1="${C}" x2="${x}" y2="${y}"/>`).join("")}
      </svg>
      <div class="core"><img src="${LOGO_SRC}" alt=""></div>
      ${names.map((n, i) => `<div class="node${i === N - 1 ? " any" : ""}" style="left:${P[i][0]}px;top:${P[i][1]}px">${n}</div>`).join("")}
      <div class="pk"></div><div class="pk"></div>`;
    el.append(hub);

    const log = h("div", "synclog");
    log.innerHTML =
      c.log.map(([sys, msg]) => `<div class="sl-row"><span class="sl-sys">${sys}</span><span class="sl-msg">${msg}</span><span class="sl-ok">${ICON.check}</span></div>`).join("") +
      `<div class="sl-appr">${ICON.check}<span>${c.approval}</span></div>`;
    if (!short) el.append(log);

    const nodes = [...hub.querySelectorAll(".node")];
    const spokes = [...hub.querySelectorAll(".sp")];
    const core = hub.querySelector(".core");
    const pks = [...hub.querySelectorAll(".pk")];
    const logRows = [...log.querySelectorAll(".sl-row")];
    const appr = log.querySelector(".sl-appr");

    // Systems light up across the spoken list of names.
    const a = vo ? vo.at + (vo.end - vo.at) * 0.14 : 0.3;
    const b = vo ? vo.at + (vo.end - vo.at) * 0.86 : Math.max(1, dur * 0.5);
    const nodeT = names.map((_, i) => (short ? 0.12 + i * 0.07 : lerp(a, b, i / (N - 1))));
    // The sync run: Salesforce -> SAP -> QuickBooks -> WhatsApp.
    const route = [1, 0, 5, 6];
    const s0 = short ? 0.75 : Math.max(b - 0.6, dur * 0.42);
    const step = short ? 0.22 : Math.min(0.8, (dur - s0 - 1.2) / route.length);
    const syncT = route.map((_, i) => s0 + i * step);
    const apprT = syncT[syncT.length - 1] + step + 0.2;

    return {
      el,
      update(t) {
        text.update(t);
        show(hub, t, 0.05, 0.5, 30);
        const pc = clamp((t - 0.1) / 0.45);
        core.style.transform = `translate(-50%, -50%) scale(${0.6 + 0.4 * backOut(pc, 1.4)})`;
        core.style.opacity = clamp(pc * 3);

        // A node glows when it is named, and again when the sync reaches it.
        const hot = nodeT.map((nt) => (t >= nt ? 1 - 0.7 * clamp((t - nt) / 0.8) : 0));
        route.forEach((ni, i) => {
          if (t >= syncT[i]) hot[ni] = Math.max(hot[ni], 1 - clamp((t - syncT[i]) / 0.6));
        });
        nodes.forEach((n, i) => {
          const p = clamp((t - nodeT[i]) / 0.35);
          n.style.opacity = 0.25 + 0.75 * clamp(p * 2);
          n.style.transform = `translate(-50%, -50%) scale(${0.9 + 0.1 * backOut(p, 1.6)})`;
          n.style.setProperty("--hot", hot[i]);
          spokes[i].style.opacity = 0.25 + 0.75 * clamp(p);
        });

        // Packets: from the source system into the hub, then out to the next.
        pks.forEach((pk) => (pk.style.opacity = 0));
        for (let i = 1; i < route.length; i++) {
          const t0 = syncT[i] - step * 0.9;
          const u = (t - t0) / (step * 0.9);
          if (u < 0 || u > 1) continue;
          const [x0, y0] = P[route[i - 1]];
          const [x1, y1] = P[route[i]];
          const e = ease.inOut(u);
          const x = e < 0.5 ? lerp(x0, C, e * 2) : lerp(C, x1, e * 2 - 1);
          const y = e < 0.5 ? lerp(y0, C, e * 2) : lerp(C, y1, e * 2 - 1);
          const pk = pks[i % 2];
          pk.style.opacity = Math.sin(u * Math.PI) * 0.8 + 0.2;
          pk.style.transform = `translate3d(${x - 7}px, ${y - 7}px, 0)`;
        }
        if (!short) {
          show(log, t, Math.max(0.3, syncT[0] - 0.5), 0.4, 20);
          logRows.forEach((r, i) => {
            const p = prog(t, syncT[i], 0.3, ease.out);
            r.style.opacity = 0.2 + 0.8 * p;
            r.style.setProperty("--ok", p);
          });
          show(appr, t, apprT, 0.4, 10);
        }

        outro(el, t, dur, short ? 0.15 : 0.25);
      },
      cues: () => [
        ...nodeT.map((t) => ({ t, type: "blip" })),
        ...syncT.map((t) => ({ t, type: "pass" })),
        ...(short ? [] : [{ t: apprT, type: "approve" }]),
      ],
    };
  },
};
