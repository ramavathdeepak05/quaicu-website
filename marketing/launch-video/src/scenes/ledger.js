// 5. "Every action is on record." Ledger blocks stamp in, each one carrying
// the previous block's hash.

import { h, lines, rise, show, outro, prog, ease, clamp, rng, hex, ICON } from "../lib.js";
import { COPY } from "../copy.js";

const RECORDS = [
  { seq: 712040, op: "triage_ticket", ok: true, who: "Engineer" },
  { seq: 712041, op: "draft_bug_fix", ok: true, who: "Engineer" },
  { seq: 712042, op: "deploy_to_production", ok: false, who: "Dual_Control" },
  { seq: 712043, op: "apply_security_patch", ok: true, who: "Lead" },
  { seq: 712044, op: "run_db_migration", ok: true, who: "Lead" },
  { seq: 712045, op: "draft_release_notes", ok: true, who: "Engineer" },
  { seq: 712046, op: "grant_repo_access", ok: true, who: "Manager" },
  { seq: 712047, op: "ship_release", ok: true, who: "Lead" },
];

export default {
  build({ fmt, dur, opts }) {
    const c = COPY.ledger;
    const flash = !!opts.flash;
    const el = h("div", "scene s-ledger" + (flash ? " flash" : ""));

    const left = h("div", "left");
    el.append(left);
    const hl = lines(left, (flash ? c.flash : c.lines).map((t, i) => (i ? { text: t, cls: "dim" } : t)), "display hl");
    const kicker = h("div", "eyebrow", c.kicker);
    left.append(kicker);

    const chainWrap = h("div", "chain-wrap");
    const chain = h("div", "chain");
    chainWrap.append(chain);
    el.append(chainWrap);

    const r = rng(2041);
    let prev = hex(r, 4) + "…" + hex(r, 4);
    const n = flash ? 3 : dur >= 5 ? 7 : 5;
    const gap = flash ? 0.26 : Math.min(0.62, (dur - 1.2) / n);
    const t0 = flash ? 0.2 : 0.45;
    const blocks = RECORDS.slice(0, n).map((rec, i) => {
      const hash = hex(r, 4) + "…" + hex(r, 4);
      const b = h("div", "blk " + (rec.ok ? "ok" : "bad"));
      b.innerHTML = `
        <div class="b-top"><span>BLOCK ${rec.seq}</span><span>${rec.ok ? "APPROVED" : "BLOCKED"}</span></div>
        <div class="b-op">${rec.op}()</div>
        <div class="b-stat">${rec.ok ? ICON.check + " Approved · " + rec.who : ICON.cross + " Blocked · " + rec.who}</div>
        <div class="b-hash"><span>hash <b>${hash}</b></span><span class="prev">prev <b>${prev}</b></span></div>`;
      const link = h("div", "link");
      link.innerHTML = `<span class="lk">${ICON.link}</span>`;
      if (i > 0) chain.append(link);
      chain.append(b);
      prev = hash;
      return { el: b, link: i > 0 ? link : null, t: t0 + i * gap };
    });

    let viewH = null;

    return {
      el,
      update(t) {
        if (viewH === null) viewH = chainWrap.offsetHeight;
        rise(hl.inners, t, 0.05, { stagger: 0.1, d: flash ? 0.5 : 0.8 });
        show(kicker, t, flash ? 0.35 : 0.9, 0.5, 12);

        // Follow the newest block: each block adds its own scroll step.
        let scroll = 0, prevTarget = 0;
        blocks.forEach((b, i) => {
          const p = prog(t, b.t, 0.34, ease.out);
          b.el.style.opacity = p;
          b.el.style.transform = p >= 1 ? "" : `translate3d(${(1 - p) * 40}px, 0, 0) scale(${1 + (1 - p) * 0.03})`;
          b.el.style.setProperty("--stamp", t >= b.t ? 1 - clamp((t - b.t) / 0.6) : 0);
          if (b.link) {
            const pl = prog(t, b.t - 0.06, 0.24, ease.out);
            b.link.style.setProperty("--grow", pl);
          }
          // the "prev" field lights up as the link is made
          const prevEl = b.el.querySelector(".prev");
          prevEl.style.setProperty("--hot", i > 0 && t >= b.t ? 1 - clamp((t - b.t - 0.1) / 0.7) : 0);
          const target = Math.max(prevTarget, b.el.offsetTop + b.el.offsetHeight - viewH);
          scroll += (target - prevTarget) * prog(t, b.t - 0.12, 0.45, ease.inOut);
          prevTarget = target;
        });
        chain.style.transform = `translate3d(0, ${-scroll}px, 0)`;

        outro(el, t, dur, flash ? 0.22 : 0.3);
      },
      cues: () => blocks.map((b) => ({ t: b.t, type: "stamp" })),
    };
  },
};
