// HTML typography layered over the WebGL frame: two cinematic titles and the
// end card with the official logo. All values are pure functions of time.

import { TYPE } from "./timeline.js";
import { clamp, easeOutCubic, easeInOutCubic, invLerp } from "./util.js";

const LOGO = "/assets/brand/logo-512.png";

export function overlay(root) {
  const mk = (cls, html) => {
    const d = document.createElement("div");
    d.className = cls;
    d.innerHTML = html;
    root.append(d);
    return d;
  };
  const t1 = mk("title", `${TYPE.beyond.text}<span class="rule"></span>`);
  t1.style.top = "77%";
  const t2 = mk("title", `${TYPE.reality.text}<span class="rule"></span>`);
  t2.style.top = "76%";
  const end = mk(
    "end",
    `<div class="lockup"><div class="glow"></div><img src="${LOGO}" alt="QUAICU"><div class="word">QUAICU</div></div>
     <div class="rule2"></div>
     <div class="line">BUILT FOR SAFER DEPLOYMENT<span class="dot">.</span></div>
     <div class="url">quaicu.org</div>`
  );
  const q = (s) => end.querySelector(s);
  const img = q("img"),
    word = q(".word"),
    glow = q(".glow"),
    line = q(".line"),
    rule2 = q(".rule2"),
    url = q(".url");

  function title(el, spec, t) {
    const a = invLerp(spec.in, spec.in + 0.55, t);
    const b = invLerp(spec.out - 0.45, spec.out, t);
    const op = easeOutCubic(a) * (1 - easeInOutCubic(b));
    el.style.opacity = op.toFixed(4);
    // letters settle inward as they appear, drift slightly as they leave
    const ls = 0.62 - 0.2 * easeOutCubic(a) + 0.05 * b;
    el.style.letterSpacing = ls.toFixed(4) + "em";
    el.style.textIndent = ls.toFixed(4) + "em";
    el.style.filter = `blur(${((1 - easeOutCubic(a)) * 0.9 + b * 0.6).toFixed(3)}vh)`;
    const r = el.querySelector(".rule");
    r.style.transform = `scaleX(${easeOutCubic(invLerp(spec.in + 0.15, spec.in + 0.85, t)).toFixed(4)})`;
  }

  return {
    update(t) {
      title(t1, TYPE.beyond, t);
      title(t2, TYPE.reality, t);
      const e0 = TYPE.end.in;
      const on = t >= e0 - 0.01;
      end.style.opacity = on ? 1 : 0;
      if (!on) return;
      const k = (a, d) => easeOutCubic(invLerp(e0 + a, e0 + a + d, t));
      const li = k(0, 0.7);
      img.style.opacity = li.toFixed(4);
      img.style.transform = `scale(${(0.94 + 0.06 * li).toFixed(4)})`;
      img.style.filter = `blur(${((1 - li) * 0.8).toFixed(3)}vh)`;
      glow.style.opacity = (k(0.05, 0.9) * (0.85 + 0.15 * Math.sin(t * 2.2))).toFixed(4);
      const lw = k(0.25, 0.7);
      word.style.opacity = lw.toFixed(4);
      const ws = 0.5 - 0.16 * lw;
      word.style.letterSpacing = ws.toFixed(4) + "em";
      word.style.textIndent = ws.toFixed(4) + "em";
      rule2.style.transform = `scaleX(${k(0.55, 0.6).toFixed(4)})`;
      rule2.style.opacity = k(0.55, 0.3).toFixed(4);
      const ll = k(0.6, 0.7);
      line.style.opacity = ll.toFixed(4);
      line.style.transform = `translateY(${((1 - ll) * 1.2).toFixed(3)}vh)`;
      url.style.opacity = (k(0.95, 0.6) * 0.95).toFixed(4);
    },
  };
}
