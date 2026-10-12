// 7. The engine does the lifting, people stay accountable: the hub from
// how-it-works.html (clients around a relationship manager, inside the AI
// engine ring).

import { h, lines, rise, outro, prog, ease, clamp, typed, blink, ICON } from "../lib.js";
import { COPY } from "../copy.js";

const N = 8;

export default {
  build({ fmt, dur }) {
    const c = COPY.hub;
    const k = Math.min(1, dur / 5);
    const el = h("div", "scene s-hub");

    const text = h("div", "text");
    el.append(text);
    const a = lines(text, c.white, "display hl");
    const b = lines(text, c.grey.map((t) => ({ text: t, cls: "dim" })), "display hl hl2");
    const kicker = h("div", "eyebrow kicker");
    text.append(kicker);

    const R = 300, r = 158, S = 760, C = S / 2;
    const ringText = Array(6).fill(c.ring).join("   ·   ");
    const ang = (i) => -Math.PI / 2 + (i / N) * Math.PI * 2;
    const svg = `
      <svg class="hub-svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
        <defs><path id="ringPath" d="M ${C} ${C - r} a ${r} ${r} 0 1 1 -0.01 0"/></defs>
        <circle class="orbit" cx="${C}" cy="${C}" r="${R}"/>
        ${Array.from({ length: N }, (_, i) => `<line class="spoke s${i}" x1="${C}" y1="${C}" x2="${C + Math.cos(ang(i)) * R}" y2="${C + Math.sin(ang(i)) * R}"/>`).join("")}
        <g class="ring-g"><circle class="ring" cx="${C}" cy="${C}" r="${r}"/>
          <text class="ring-t"><textPath href="#ringPath">${ringText}</textPath></text></g>
      </svg>`;
    const hub = h("div", "hub");
    hub.innerHTML = svg + `
      <div class="center"><span class="cic">${ICON.person}</span><span class="cl">${c.center[0]}<br>${c.center[1]}</span></div>
      ${Array.from({ length: N }, (_, i) => `<div class="client" style="left:${C + Math.cos(ang(i)) * R}px;top:${C + Math.sin(ang(i)) * R}px"><span>${String(i + 1).padStart(2, "0")}</span></div>`).join("")}
      ${Array.from({ length: N }, () => `<div class="hp"></div>`).join("")}`;
    el.append(hub);

    const center = hub.querySelector(".center");
    const ringG = hub.querySelector(".ring-g");
    const ring = hub.querySelector(".ring");
    const orbit = hub.querySelector(".orbit");
    const spokes = [...hub.querySelectorAll(".spoke")];
    const clients = [...hub.querySelectorAll(".client")];
    const hps = [...hub.querySelectorAll(".hp")];
    const ringLen = 2 * Math.PI * r;
    const orbitLen = 2 * Math.PI * R;

    const T = { a: 0.05, b: 0.75 * k, kick: 2.5 * k, center: 0.15, ring: 0.35, clients: 0.6, pulses: 1.3 };
    // Work goes out to each client and comes back checked.
    const pulseT = Array.from({ length: N }, (_, i) => T.pulses + i * ((dur - T.pulses - 1.1) / N));

    return {
      el,
      update(t) {
        rise(a.inners, t, T.a, { stagger: 0.1 });
        rise(b.inners, t, T.b, { stagger: 0.1 });
        const kt = typed(c.kicker, t, T.kick, 30);
        kicker.style.opacity = t >= T.kick ? 1 : 0;
        kicker.innerHTML = `${kt}<span class="caret" style="opacity:${t < T.kick + c.kicker.length / 30 + 0.3 || blink(t, 1.2) ? 1 : 0}"></span>`;

        const pc = prog(t, T.center, 0.5, ease.out);
        center.style.opacity = pc;
        center.style.transform = `translate(-50%, -50%) scale(${0.7 + 0.3 * pc})`;

        const pr = prog(t, T.ring, 0.9, ease.inOut);
        ring.style.strokeDashoffset = ringLen * (1 - pr);
        ring.style.strokeDasharray = ringLen;
        ringG.style.transform = `rotate(${t * 14}deg)`;
        hub.querySelector(".ring-t").style.opacity = prog(t, T.ring + 0.5, 0.5);
        orbit.style.strokeDasharray = `${orbitLen * prog(t, T.ring, 1.0, ease.inOut)} ${orbitLen}`;

        clients.forEach((cl, i) => {
          const p = prog(t, T.clients + i * 0.06, 0.4, ease.out);
          cl.style.opacity = p;
          cl.style.transform = `translate(-50%, -50%) scale(${0.6 + 0.4 * p})`;
          const lit = t >= pulseT[i] + 0.35 ? 1 - 0.6 * clamp((t - pulseT[i] - 0.35) / 1.2) : 0;
          cl.style.setProperty("--lit", lit);
          spokes[i].style.opacity = 0.25 + 0.75 * p * (lit > 0 ? lit : 0.35);
        });

        hps.forEach((hp, i) => {
          const u = (t - pulseT[i]) / 0.35;
          if (u < 0 || u > 1) { hp.style.opacity = 0; return; }
          const e = ease.inOut(u);
          const x = C + Math.cos(ang(i)) * (r + (R - r) * e);
          const y = C + Math.sin(ang(i)) * (r + (R - r) * e);
          hp.style.opacity = Math.sin(u * Math.PI);
          hp.style.transform = `translate3d(${x - 6}px, ${y - 6}px, 0)`;
        });

        outro(el, t, dur, 0.3);
      },
      cues: () => [
        ...pulseT.map((t) => ({ t: t + 0.35, type: "ping" })),
        { t: T.kick, type: "typing", n: c.kicker.length, cps: 30 },
      ],
    };
  },
};
