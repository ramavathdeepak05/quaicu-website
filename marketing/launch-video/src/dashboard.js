// A business dashboard built from a config (see dashboards.js): KPI tiles
// that count up, a line or bar chart, a donut or funnel, and a table. Charts
// are SVG and draw in as a pure function of time, like everything else.
//
//   const d = dashboard(cfg);  parent.append(d.el);
//   d.update(t, speed)  // t: seconds since the dashboard appeared

import { h, clamp, ease, backOut, fmtNum, ICON } from "./lib.js";

const FMT = {
  int: (v) => fmtNum(Math.round(v)),
  cr: (v) => `₹${v.toFixed(2)} Cr`,
  l: (v) => `₹${v.toFixed(1)}L`,
  pct: (v) => `${v.toFixed(1)}%`,
  h: (v) => `${v.toFixed(1)}h`,
};

let uid = 0;

// Smooth line through points (Catmull-Rom as cubic Beziers).
function smooth(pts) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function kpiTile(k) {
  const spark = k.spark || [3, 4, 3.5, 5, 4.6, 6, 6.4, 7.2];
  const max = Math.max(...spark), min = Math.min(...spark);
  const pts = spark.map((v, i) => [(i / (spark.length - 1)) * 120, 34 - ((v - min) / (max - min || 1)) * 30]);
  const el = h("div", "db-kpi");
  el.innerHTML = `
    <span class="l">${k.label}</span>
    <span class="v"></span>
    <span class="row">${k.delta ? `<span class="delta${k.bad ? " bad" : ""}">${k.delta}</span>` : ""}
      <svg class="spark" viewBox="-2 0 124 38"><path d="${smooth(pts)}"/></svg></span>`;
  return { el, v: el.querySelector(".v"), k };
}

function lineChart(w) {
  const id = "dbc" + uid++;
  const W = 800, H = 230;
  const all = w.series.flatMap((s) => s.data);
  const max = Math.max(...all) * 1.1;
  const paths = w.series.map((s, si) => {
    const pts = s.data.map((v, i) => [(i / (s.data.length - 1)) * W, H - (v / max) * H]);
    const line = smooth(pts);
    const area = `${line} L ${W} ${H} L 0 ${H} Z`;
    return `${si === 0 ? `<path class="area" d="${area}" fill="url(#${id}g)"/>` : ""}<path class="ln s${si}" d="${line}"/>`;
  });
  const el = h("div", "db-card w-line");
  el.innerHTML = `
    <div class="db-ct"><span>${w.title}</span><span class="legend">${w.series.map((s, i) => `<i class="s${i}"></i>${s.name}`).join("")}</span></div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2bb673" stop-opacity="0.32"/><stop offset="1" stop-color="#2bb673" stop-opacity="0"/></linearGradient>
        <clipPath id="${id}c"><rect x="0" y="-10" width="0" height="${H + 20}"/></clipPath>
      </defs>
      ${[0.25, 0.5, 0.75].map((f) => `<line class="gl" x1="0" x2="${W}" y1="${H * f}" y2="${H * f}"/>`).join("")}
      <g clip-path="url(#${id}c)">${paths.join("")}</g>
    </svg>
    <div class="axis">${(w.labels || []).map((l) => `<span>${l}</span>`).join("")}</div>`;
  const rect = el.querySelector("clipPath rect");
  return { el, update: (p) => rect.setAttribute("width", (p * W).toFixed(1)) };
}

function barChart(w) {
  const max = Math.max(...w.items.map((x) => x[1]));
  const el = h("div", "db-card w-bars");
  el.innerHTML = `
    <div class="db-ct"><span>${w.title}</span></div>
    <div class="bars">${w.items.map(([l, v], i) => `<div class="b"><div class="bt"><i style="height:${(v / max) * 100}%"${i === w.hi ? ' class="hi"' : ""}></i></div><span>${l}</span></div>`).join("")}</div>`;
  const bars = [...el.querySelectorAll(".bt i")];
  return {
    el,
    update: (p) => bars.forEach((b, i) => (b.style.transform = `scaleY(${ease.out(clamp(p * 1.6 - i * 0.12))})`)),
  };
}

function donut(w) {
  const total = w.items.reduce((a, x) => a + x[1], 0);
  const r = 70, C = 2 * Math.PI * r;
  let acc = 0;
  const segs = w.items.map(([, v]) => {
    const s = { start: acc / total, share: v / total };
    acc += v;
    return s;
  });
  const el = h("div", "db-card w-donut");
  el.innerHTML = `
    <div class="db-ct"><span>${w.title}</span></div>
    <div class="dn">
      <svg viewBox="0 0 200 200"><circle class="track" cx="100" cy="100" r="${r}"/>
        ${w.items.map((x, i) => `<circle class="seg c${i}" cx="100" cy="100" r="${r}"/>`).join("")}</svg>
      <div class="dn-c"><b>${w.center[0]}</b><span>${w.center[1]}</span></div>
      <div class="dn-l">${w.items.map(([l, v], i) => `<span><i class="c${i}"></i>${l}<b>${v}%</b></span>`).join("")}</div>
    </div>`;
  const circles = [...el.querySelectorAll(".seg")];
  return {
    el,
    update: (p) => {
      const e = ease.inOut(p);
      circles.forEach((c, i) => {
        const vis = clamp(e - segs[i].start, 0, segs[i].share);
        c.setAttribute("stroke-dasharray", `${(vis * C).toFixed(1)} ${C.toFixed(1)}`);
        c.setAttribute("stroke-dashoffset", (-segs[i].start * C).toFixed(1));
      });
    },
  };
}

function funnel(w) {
  const max = w.items[0][1];
  const el = h("div", "db-card w-funnel");
  el.innerHTML = `
    <div class="db-ct"><span>${w.title}</span></div>
    <div class="fn">${w.items.map(([l, v]) => `<div class="fr"><span class="fl">${l}</span><div class="ft"><i style="width:${(v / max) * 100}%"></i></div><b data-v="${v}">0</b></div>`).join("")}</div>`;
  const bars = [...el.querySelectorAll(".ft i")];
  const nums = [...el.querySelectorAll(".fr b")];
  return {
    el,
    update: (p) => {
      bars.forEach((b, i) => (b.style.transform = `scaleX(${ease.out(clamp(p * 1.5 - i * 0.18))})`));
      nums.forEach((n, i) => (n.textContent = fmtNum(Math.round(+n.dataset.v * ease.out(clamp(p * 1.5 - i * 0.18))))));
    },
  };
}

function table(w) {
  const el = h("div", "db-card w-table");
  el.innerHTML = `
    <div class="db-ct"><span>${w.title}</span></div>
    <div class="tb">
      <div class="tr th">${w.cols.map((c) => `<span>${c}</span>`).join("")}</div>
      ${w.rows.map((r) => `<div class="tr">${r.map((c, i) => (i === r.length - 1 ? `<span class="pill p-${c.toLowerCase().replace(/[^a-z]/g, "")}">${c === "Approved" ? ICON.check : ""}${c}</span>` : `<span>${c}</span>`)).join("")}</div>`).join("")}
    </div>`;
  const rows = [...el.querySelectorAll(".tr:not(.th)")];
  return {
    el,
    update: (p) => rows.forEach((r, i) => {
      const q = ease.out(clamp(p * 1.6 - i * 0.15));
      r.style.opacity = q;
      r.style.transform = q >= 1 ? "" : `translate3d(${(1 - q) * 24}px, 0, 0)`;
    }),
  };
}

const WIDGETS = { line: lineChart, bars: barChart, donut, funnel, table };

export function dashboard(cfg) {
  const el = h("div", "db");
  el.innerHTML = `
    <div class="db-top">
      <span class="db-ic" style="background:${cfg.color || "#008746"}">${cfg.app[0]}</span>
      <span class="db-app">${cfg.app}</span>
      <span class="db-crumb">${cfg.crumb}</span>
      <span class="db-live"><i></i>Live</span>
      <span class="db-range">This month</span>
      <span class="db-av">QU</span>
    </div>
    <div class="db-body"><div class="db-kpis"></div><div class="db-main"></div></div>`;
  const kpiBox = el.querySelector(".db-kpis");
  const main = el.querySelector(".db-main");
  const body = el.querySelector(".db-body");
  const kpis = cfg.kpis.map((k) => {
    const t = kpiTile(k);
    kpiBox.append(t.el);
    return t;
  });
  const wMain = WIDGETS[cfg.main.type](cfg.main);
  const wSide = WIDGETS[cfg.side.type](cfg.side);
  main.append(wMain.el, wSide.el);
  let wFoot = null;
  if (cfg.foot) {
    wFoot = WIDGETS[cfg.foot.type](cfg.foot);
    wFoot.el.classList.add("foot");
    body.append(wFoot.el);
  }
  const live = el.querySelector(".db-live i");

  return {
    el,
    // t: seconds since this dashboard appeared; speed > 1 plays faster.
    update(t, speed = 1) {
      const u = t * speed;
      kpis.forEach((k, i) => {
        const p = clamp((u - 0.05 - i * 0.07) / 0.7);
        const e = ease.out(p);
        // Once counted up, numbers keep ticking to feel live.
        const tick = k.k.tick ? Math.max(0, Math.floor((u - 1.2) / 0.45)) * k.k.tick : 0;
        k.v.textContent = FMT[k.k.fmt || "int"](k.k.value * e + tick);
        k.el.style.opacity = clamp(p * 4);
        k.el.style.transform = `translate3d(0, ${(1 - backOut(clamp(p * 1.4), 1.3)) * 16}px, 0)`;
      });
      wMain.update(clamp((u - 0.2) / 0.9));
      wSide.update(clamp((u - 0.3) / 0.9));
      if (wFoot) wFoot.update(clamp((u - 0.45) / 0.9));
      live.style.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2 / 1.1));
    },
  };
}
