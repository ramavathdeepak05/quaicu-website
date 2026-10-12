// 4. The product window from the home page ("Delivery Activity"), live:
// AI proposes, rules enforce, humans approve. Event names, policies and row
// wording are the ones in assets/site.js. Marked Demo, like on the site.

import { h, rise, outro, prog, ease, clamp, lerp, pulse, clock, fmtNum, ICON } from "../lib.js";
import { COPY } from "../copy.js";

const ACTIONS = [
  { op: "triage_ticket", actor: "Support·Intake", policy: "Scope_Check", approver: "Engineer" },
  { op: "draft_bug_fix", actor: "Support·Engine", policy: "Change_Review", approver: "Engineer" },
  { op: "deploy_to_production", actor: "Build·Infra", policy: "Dual_Control", approver: "Lead", block: true },
  { op: "apply_security_patch", actor: "Support·Infra", policy: "Change_Review", approver: "Lead" },
  { op: "run_db_migration", actor: "Build·Data", policy: "Air_Gap+Dual", approver: "Lead" },
  { op: "draft_release_notes", actor: "Build·Docs", policy: "Style_Check", approver: "Engineer" },
  { op: "grant_repo_access", actor: "Support·Access", policy: "Least_Privilege", approver: "Manager" },
  { op: "ship_release", actor: "Build·Release", policy: "Dual_Control", approver: "Lead" },
  { op: "request_code_review", actor: "Build·Engine", policy: "HITL_Review", approver: "Engineer" },
  { op: "update_client", actor: "Support·Manager", policy: "Consent+Throttle", approver: "Manager" },
  { op: "draft_root_cause", actor: "Support·Engine", policy: "Change_Review", approver: "Engineer" },
  { op: "deploy_to_staging", actor: "Build·Infra", policy: "Env_Boundary", approver: "Lead" },
  { op: "verify_backup", actor: "Support·Infra", policy: "Det_Only", approver: "Engineer" },
  { op: "prepare_ticket_summary", actor: "Support·Manager", policy: "Three_Way_Match", approver: "Manager" },
];

const CLOCK0 = 2 * 3600 + 14 * 60 + 5; // 02:14:05, continuing the hook
const KPI0 = [18432, 142, 14209];

// Queue model: events are proposed at a steady rate, checked by rules once
// that phase has started, then wait for a person.
function schedule(dur, P) {
  const s = Math.max(dur / 14, 0.55);
  const gapS = 0.78 * s, gapR = 0.5 * s, gapA = 0.62 * s;
  const ev = [];
  let rPrev = -1, aPrev = -1;
  for (let i = 0; i < ACTIONS.length; i++) {
    const a = ACTIONS[i];
    const sp = P[0] + 0.3 + i * gapS;
    if (sp > dur - 0.35) break;
    const r = Math.max(sp + 0.5 * s, P[1] + 0.25, rPrev + gapR);
    rPrev = r;
    let ap = Infinity, ok = Infinity;
    if (!a.block) {
      ap = Math.max(r + 0.45 * s, P[2] + 0.25, aPrev + gapA);
      aPrev = ap;
      ok = ap + 0.7 * s;
    }
    ev.push({ i, a, id: "#" + (712040 + i), sp, r, ap, ok });
  }
  return ev;
}

export default {
  build({ fmt, dur, opts }) {
    const c = COPY.pipeline;
    const v = fmt === "9x16";
    const k = dur / 14;
    const P = [0.45, 4.3, 8.2, 11.6].map((x) => x * k);
    const ev = schedule(dur, P);

    const el = h("div", "scene s-pipe");
    const phr = h("div", "phr display");
    const phrases = c.phrases.map((p) => {
      const ln = h("span", "ln");
      const i = h("span", "ln-i", p);
      ln.append(i);
      phr.append(ln);
      return i;
    });
    el.append(phr);

    const wrap = h("div", "win-wrap");
    const win = h("div", "win");
    wrap.append(win);
    el.append(wrap);
    win.innerHTML = `
      <aside class="side">
        <span class="sb"></span><span class="sb"></span><span class="sb on"></span><span class="sb"></span><span class="sb"></span>
        <span class="av">D</span><span class="av">X</span><span class="av">A</span>
      </aside>
      <div class="main">
        <div class="head">
          <div class="hl"><span class="title">${c.title}</span><span class="badge"><span class="blamp"></span>${c.badge}</span></div>
          <span class="newbtn">+ ${c.newEvent}</span>
        </div>
        <div class="tabs">${c.tabs.map((t, i) => `<span class="tab${i ? "" : " on"}">${t}</span>`).join("")}</div>
        <div class="kpi">${c.kpi.map((l, i) => `<div><span class="label">${l}</span><span class="value v${i}">0</span></div>`).join("")}</div>
        <div class="kernel">
          ${c.cols.map((col, i) => `
            <div class="col c${i}">
              <div class="col-head"><span class="num">${i + 1}</span><span class="label">${col.label}</span><span class="status"><span class="lamp"></span>${col.status}</span><span class="accent"></span></div>
              <div class="stream"></div>
            </div>`).join("")}
          <div class="pkts"></div>
        </div>
        <div class="statusbar"><span class="health"><span class="hlamp"></span>${c.health}</span><span>${c.chain}</span></div>
      </div>`;

    const cols = [...win.querySelectorAll(".col")];
    const streams = cols.map((col) => col.querySelector(".stream"));
    const lamps = [...win.querySelectorAll(".col .lamp")];
    const accents = [...win.querySelectorAll(".col .accent")];
    const kpis = [0, 1, 2].map((i) => win.querySelector(".v" + i));
    const pktLayer = win.querySelector(".pkts");
    const kernel = win.querySelector(".kernel");
    const badgeLamp = win.querySelector(".blamp");
    const healthLamp = win.querySelector(".hlamp");

    // One row per event per column.
    const mk = (col, e, top, body, cls) => {
      const row = h("div", "row " + cls);
      row.innerHTML = `<div class="row-top"><span>${clock(CLOCK0 + e)}</span><span>${top}</span></div><div class="row-body">${body}</div>`;
      streams[col].append(row);
      return { el: row, enter: e };
    };
    const rows = [[], [], []];
    const approveRows = [];
    for (const e of ev) {
      rows[0].push(mk(0, e.sp, e.id, `${e.a.actor} ${ICON.arrow} <strong>${e.a.op}()</strong>`, "wait"));
      if (e.r < dur) {
        const r = mk(1, e.r, `${e.id} · ${e.a.policy}`,
          e.a.block ? `<span class="stat">BLOCK · policy violation</span>` : `<span class="stat">PASS · within authority</span>`,
          e.a.block ? "block" : "pass");
        r.blocked = !!e.a.block;
        rows[1].push(r);
      }
      if (e.ap < dur) {
        const r = mk(2, e.ap, `${e.id} · ${e.a.approver}`,
          `<span class="stat await"><span class="alamp"></span>AWAITING · ${e.a.approver}</span><span class="stat done">${ICON.check} APPROVED · ${e.a.approver}</span>`,
          "appr");
        r.ok = e.ok;
        approveRows.push(r);
        rows[2].push(r);
      }
    }
    const pkts = [];
    for (const e of ev) {
      if (e.r < dur) pkts.push({ from: 0, to: 1, t: e.r, src: rows[0].find((r) => r.enter === e.sp), bad: !!e.a.block });
      if (e.ap < dur) pkts.push({ from: 1, to: 2, t: e.ap, src: rows[1].find((r) => r.enter === e.r) });
    }
    for (const p of pkts) {
      p.el = h("div", "pkt" + (p.bad ? " bad" : ""));
      pktLayer.append(p.el);
    }

    let L = null; // layout, measured on first update
    const rowY = (list, row, t) => {
      let y = 0;
      for (const o of list) {
        if (o !== row && o.enter > row.enter && o.enter <= t) y += L.rowH * prog(t, o.enter, 0.38, ease.out);
      }
      return y;
    };

    return {
      el,
      update(t) {
        if (!L) {
          const kb = kernel.getBoundingClientRect();
          const sc = kb.width / kernel.offsetWidth || 1;
          L = {
            rowH: rows[0][0] ? rows[0][0].el.offsetHeight : 70,
            streams: streams.map((s) => {
              const b = s.getBoundingClientRect();
              return { x: (b.left - kb.left) / sc, y: (b.top - kb.top) / sc, w: s.offsetWidth, h: s.offsetHeight };
            }),
          };
        }

        // Phrases rise one by one; the newest is white, earlier ones grey.
        let cur = -1;
        phrases.forEach((p, i) => {
          if (t >= P[i]) cur = i;
        });
        phrases.forEach((p, i) => {
          const pp = prog(t, P[i], 0.75, ease.out);
          p.style.transform = pp >= 1 ? "" : `translate3d(0, ${(1 - pp) * 112}%, 0)`;
          const bright = t >= P[3] || i === cur;
          p.style.color = bright ? "var(--fg)" : "var(--aw-fg-3)";
        });

        // Window enters tilted (as on the site) and settles flat.
        const pin = prog(t, 0.05, 0.9 * Math.max(k, 0.6), ease.out);
        const pf = prog(t, 0.3 * k, 2.4 * Math.max(k, 0.5), ease.inOut);
        const push = 0.018 * (t / dur);
        win.style.opacity = pin;
        win.style.transform =
          `translate3d(0, ${(1 - pin) * 90}px, 0) rotateY(${-9 * (1 - pf)}deg) rotateX(${4 * (1 - pf)}deg) ` +
          `rotate(${-0.6 * (1 - pf)}deg) scale(${0.95 + 0.05 * pf + push})`;

        // Column focus follows the phrases.
        cols.forEach((col, i) => {
          const on = prog(t, P[i] - 0.1, 0.45);
          col.style.opacity = lerp(0.3, 1, on);
          accents[i].style.transform = `scaleX(${prog(t, P[i], 0.6, ease.out)})`;
          lamps[i].style.opacity = on > 0 ? 0.3 + 0.7 * pulse(t + i * 0.3) : 0.3;
        });
        badgeLamp.style.opacity = 0.35 + 0.65 * pulse(t, 1.4);
        healthLamp.style.opacity = 0.35 + 0.65 * pulse(t + 0.5, 1.4);

        // Rows
        rows.forEach((list, ci) => {
          for (const r of list) {
            if (t < r.enter) { r.el.style.display = "none"; continue; }
            const y = rowY(list, r, t);
            if (y > L.streams[ci].h) { r.el.style.display = "none"; continue; }
            r.el.style.display = "";
            const p = prog(t, r.enter, 0.32, ease.out);
            r.el.style.opacity = p;
            r.el.style.transform = `translate3d(0, ${y - (1 - p) * 12}px, 0)`;
            const flash = 1 - clamp((t - r.enter) / 0.7);
            r.el.style.setProperty("--flash", r.blocked ? Math.max(flash, 0.25) : flash);
          }
        });
        for (const r of approveRows) {
          const done = prog(t, r.ok, 0.25, ease.out);
          r.el.style.setProperty("--done", done);
          r.el.style.setProperty("--okflash", t >= r.ok ? 1 - clamp((t - r.ok) / 0.8) : 0);
          const al = r.el.querySelector(".alamp");
          al.style.opacity = 0.3 + 0.7 * pulse(t, 0.9);
        }

        // Packets travel between columns just before a row lands.
        for (const p of pkts) {
          const t0 = p.t - 0.32;
          if (t < t0 || t > p.t + 0.05 || !p.src) { p.el.style.opacity = 0; continue; }
          const u = ease.inOut(clamp((t - t0) / 0.32));
          const A = L.streams[p.from], B = L.streams[p.to];
          const sy = rowY(rows[p.from], p.src, t0) + L.rowH / 2;
          let x0, y0, x1, y1;
          if (!v) {
            x0 = A.x + A.w - 26; y0 = A.y + sy;
            x1 = B.x + 26; y1 = B.y + L.rowH / 2;
          } else {
            x0 = A.x + A.w - 60; y0 = A.y + Math.min(sy, A.h - 10);
            x1 = B.x + 60; y1 = B.y + L.rowH / 2;
          }
          p.el.style.opacity = Math.sin(u * Math.PI) * 0.9 + 0.1;
          p.el.style.transform = `translate3d(${lerp(x0, x1, u) - 6}px, ${lerp(y0, y1, u) - 6}px, 0)`;
        }

        // KPIs (demo counters)
        const n0 = ev.filter((e) => e.sp <= t).length;
        const n1 = ev.filter((e) => e.a.block && e.r <= t).length;
        const n2 = ev.filter((e) => e.ok <= t).length;
        kpis[0].textContent = fmtNum(KPI0[0] + n0);
        kpis[1].textContent = fmtNum(KPI0[1] + n1);
        kpis[2].textContent = fmtNum(KPI0[2] + n2);

        outro(el, t, dur, 0.3);
      },
      cues: () => {
        const out = P.slice(0, 3).map((t) => ({ t, type: "phrase" }));
        for (const e of ev) {
          out.push({ t: e.sp, type: "blip" });
          if (e.r < dur - 0.2) out.push({ t: e.r, type: e.a.block ? "block" : "pass" });
          if (e.ok < dur - 0.2) out.push({ t: e.ok, type: "approve" });
        }
        return out;
      },
    };
  },
};
